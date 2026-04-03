import { Router } from "express";
import { z } from "zod";
import { query, ensureProjectAttachmentsTable, ensureQuoteVerificationTable } from "../db.js";
import { createHash, randomUUID } from "crypto";
import { buildQuotePdfBuffer } from "../lib/quotePdf.js";
import {
  getQuoteSigningPublicInfo,
  signQuoteHash,
  verifyQuoteHashSignature,
} from "../lib/quoteSignature.js";
import { requireAuth } from "../middleware/auth.js";

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

const projectSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  client: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.string().optional().default("draft"),
  createdAt: z.string().optional().nullable(),
});

const attachmentSchema = z.object({
  name: z.string().min(1),
  type: z.string().optional().nullable(),
  size: z.number().nonnegative().default(0),
  dataUrl: z.string().min(10),
});

const attachmentPayloadSchema = z.object({
  items: z.array(attachmentSchema).min(1),
});

const versionPayloadSchema = z.object({
  snapshot: z.any(),
  name: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  locked: z.boolean().optional(),
  author: z.string().optional().nullable(),
});

const quoteVerificationPayloadSchema = z
  .object({
    sha256: z.string().optional().nullable(),
    dataUrl: z.string().optional().nullable(),
    base64: z.string().optional().nullable(),
  })
  .refine(
    (payload) =>
      Boolean(
        String(payload.sha256 || "").trim() ||
          String(payload.dataUrl || "").trim() ||
          String(payload.base64 || "").trim()
      ),
    {
    message: "Debes enviar sha256, dataUrl o base64",
    path: ["sha256"],
    }
  );

const ensureProjectColumns = async () => {
  await query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS client text");
  await query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS reference text");
  await query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS address text");
  await query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS versions jsonb");
};

const parseCreatedAt = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const decodeDataUrl = (dataUrl = "") => {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  const mime = match[1] || "application/octet-stream";
  const data = Buffer.from(match[2], "base64");
  return { mime, data };
};

const normalizeSha256 = (value = "") => String(value || "").trim().toLowerCase();

const isValidSha256 = (value = "") => /^[a-f0-9]{64}$/i.test(value);

const decodeBase64Payload = (base64 = "") => {
  try {
    const normalized = String(base64 || "").trim();
    if (!normalized) return null;
    return Buffer.from(normalized, "base64");
  } catch {
    return null;
  }
};

/**
 * @openapi
 * /api/projects:
 *   get:
 *     tags:
 *       - Projects
 *     summary: Lista proyectos
 *     responses:
 *       200:
 *         description: Lista de proyectos
 */
projectsRouter.get("/", async (req, res) => {
  try {
    await ensureProjectColumns();
    const result = await query(
      "SELECT id, name, type, client, reference, address, notes, status, created_at, updated_at, COALESCE(jsonb_array_length(versions), 0) AS versions_count FROM projects ORDER BY created_at DESC"
    );
    res.json({ items: result.rows });
  } catch (error) {
    res.status(500).json({ error: "Error listando proyectos" });
  }
});

/**
 * @openapi
 * /api/projects/{projectId}/attachments:
 *   get:
 *     tags:
 *       - Projects
 *     summary: Lista adjuntos de un proyecto
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de adjuntos
 */
projectsRouter.get("/:projectId/attachments", async (req, res) => {
  try {
    await ensureProjectAttachmentsTable();
    const result = await query(
      `SELECT id, name, mime_type, size, created_at
       FROM project_attachments
       WHERE project_id = $1
       ORDER BY created_at DESC`,
      [req.params.projectId]
    );
    res.json({ items: result.rows });
  } catch (error) {
    res.status(500).json({ error: "Error listando adjuntos" });
  }
});

/**
 * @openapi
 * /api/projects/{projectId}/attachments:
 *   post:
 *     tags:
 *       - Projects
 *     summary: Sube adjuntos a un proyecto
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *     responses:
 *       201:
 *         description: Adjuntos creados
 */
projectsRouter.post("/:projectId/attachments", async (req, res) => {
  const parsed = attachmentPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.format() });
  }

  try {
    await ensureProjectAttachmentsTable();
    const { projectId } = req.params;
    const existing = await query("SELECT 1 FROM projects WHERE id = $1", [projectId]);
    if (!existing.rows.length) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }

    const createdItems = [];
    const maxSize = 5 * 1024 * 1024;
    for (const item of parsed.data.items) {
      const decoded = decodeDataUrl(item.dataUrl);
      if (!decoded) {
        return res.status(400).json({ error: "Formato de adjunto inválido" });
      }
      if (decoded.data.length > maxSize) {
        return res.status(400).json({ error: "El adjunto supera 5MB" });
      }
      const id = randomUUID();
      const result = await query(
        `INSERT INTO project_attachments (id, project_id, name, mime_type, size, data)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, mime_type, size, created_at`,
        [id, projectId, item.name, item.type || decoded.mime, item.size || decoded.data.length, decoded.data]
      );
      createdItems.push(result.rows[0]);
    }
    res.status(201).json({ items: createdItems });
  } catch (error) {
    res.status(500).json({ error: "Error subiendo adjuntos" });
  }
});

/**
 * @openapi
 * /api/projects/{projectId}/attachments/{attachmentId}:
 *   get:
 *     tags:
 *       - Projects
 *     summary: Descarga un adjunto
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *       - in: path
 *         name: attachmentId
 *         required: true
 *     responses:
 *       200:
 *         description: Archivo adjunto
 */
projectsRouter.get("/:projectId/attachments/:attachmentId", async (req, res) => {
  try {
    await ensureProjectAttachmentsTable();
    const { projectId, attachmentId } = req.params;
    const result = await query(
      `SELECT name, mime_type, data
       FROM project_attachments
       WHERE project_id = $1 AND id = $2`,
      [projectId, attachmentId]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "Adjunto no encontrado" });
    }
    const file = result.rows[0];
    res.setHeader("Content-Type", file.mime_type || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename=\"${file.name}\"`);
    res.send(file.data);
  } catch (error) {
    res.status(500).json({ error: "Error descargando adjunto" });
  }
});

/**
 * @openapi
 * /api/projects/{projectId}/attachments/{attachmentId}:
 *   delete:
 *     tags:
 *       - Projects
 *     summary: Elimina un adjunto
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *       - in: path
 *         name: attachmentId
 *         required: true
 *     responses:
 *       200:
 *         description: Adjunto eliminado
 */
projectsRouter.delete("/:projectId/attachments/:attachmentId", async (req, res) => {
  try {
    await ensureProjectAttachmentsTable();
    const { projectId, attachmentId } = req.params;
    await query(
      "DELETE FROM project_attachments WHERE project_id = $1 AND id = $2",
      [projectId, attachmentId]
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando adjunto" });
  }
});

/**
 * @openapi
 * /api/projects:
 *   post:
 *     tags:
 *       - Projects
 *     summary: Crea un proyecto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Proyecto creado
 */
projectsRouter.post("/", async (req, res) => {
  console.log('[projects] POST /api/projects received');
  console.log('[projects] body:', JSON.stringify(req.body).slice(0, 2000));
  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.format() });
  }

  const { name, type, client, reference, address, notes, status, createdAt } = parsed.data;
  const id = randomUUID();
  try {
    await ensureProjectColumns();
    console.time('[projects] insert');
    const createdAtValue = parseCreatedAt(createdAt);
    const result = await query(
      `INSERT INTO projects (id, name, type, client, reference, address, notes, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, NOW()), NOW())
       RETURNING id, name, type, client, reference, address, notes, status, created_at, updated_at`,
      [id, name, type, client ?? null, reference ?? null, address ?? null, notes ?? null, status, createdAtValue]
    );
    console.timeEnd('[projects] insert');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[projects] error creating project:', error && error.stack ? error.stack : error);
    // expose message to help debugging in dev
    res.status(500).json({ error: "Error creando proyecto", message: String(error?.message || error) });
  }
});

/**
 * @openapi
 * /api/projects/{projectId}:
 *   get:
 *     tags:
 *       - Projects
 *     summary: Obtiene un proyecto por id
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Proyecto
 *       404:
 *         description: No encontrado
 */
projectsRouter.get("/:projectId", async (req, res) => {
  try {
    await ensureProjectColumns();
    const result = await query(
      "SELECT id, name, type, client, reference, address, notes, status, created_at, updated_at, COALESCE(jsonb_array_length(versions), 0) AS versions_count FROM projects WHERE id = $1",
      [req.params.projectId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo proyecto" });
  }
});

/**
 * @openapi
 * /api/projects/{projectId}/design:
 *   get:
 *     tags:
 *       - Projects
 *     summary: Obtiene el diseño del proyecto
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Diseño
 */
projectsRouter.get("/:projectId/design", async (req, res) => {
  try {
    const result = await query("SELECT design FROM projects WHERE id = $1", [req.params.projectId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }
    res.json({ design: result.rows[0].design || { boxes: [], cables: [] } });
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo diseño" });
  }
});

// Build a lightweight quote JSON for a project
projectsRouter.get("/:projectId/quote", async (req, res) => {
  try {
    if (req.params.projectId.startsWith("local-")) {
      return res.status(400).json({ error: "Proyecto local no guardado. Guarda el proyecto antes de generar presupuesto." });
    }
    await ensureProjectColumns();
    const result = await query(
      "SELECT id, name, type, client, reference, address, notes, status, design FROM projects WHERE id = $1",
      [req.params.projectId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Proyecto no encontrado" });
    const project = result.rows[0];
    const design = project.design || { boxes: [], cables: [] };

    // Build items from boxes components and devices inside design (best-effort)
    const items = [];
    (design.boxes || []).forEach((box) => {
      (box.components || []).forEach((c) => {
        items.push({
          type: 'component',
          boxId: box.id,
          boxName: box.name,
          model: c.model || c.name,
          quantity: Number(c.quantity) || 1,
          unitPrice: Number(c.unitPrice) || 0,
          customerDiscountPercent: Number(c.customerDiscountPercent) || 0,
          discountApplied: Boolean(c.discountApplied),
          total: Number(c.total) || 0,
        });
      });
    });

    const devices = (design.devices || []).map((d) => ({
      type: 'device',
      id: d.id,
      model: d.model || d.name,
      quantity: 1,
      unitPrice: Number(d.unitPrice) || 0,
      total: Number(d.total) || Number(d.unitPrice) || 0,
    }));

    const allItems = items.concat(devices);
    const subtotal = allItems.reduce((s, it) => s + (Number(it.total) || (Number(it.unitPrice || 0) * Number(it.quantity || 1))), 0);
    const quote = {
      projectId: project.id,
      name: project.name,
      type: project.type,
      client: project.client,
      reference: project.reference,
      address: project.address,
      notes: project.notes,
      items: allItems,
      subtotal,
      taxes: 0,
      total: subtotal,
      generatedAt: new Date().toISOString(),
    };
    res.json(quote);
  } catch (error) {
    console.error('[projects] quote error', error && error.stack ? error.stack : error);
    res.status(500).json({ error: 'Error generando presupuesto' });
  }
});

// Stream a styled PDF quote using pdfkit helper
projectsRouter.get("/:projectId/quote.pdf", async (req, res) => {
  try {
    if (req.params.projectId.startsWith("local-")) {
      return res.status(400).json({ error: "Proyecto local no guardado. Guarda el proyecto antes de generar PDF." });
    }
    await ensureProjectColumns();
    const result = await query(
      "SELECT id, name, type, client, reference, address, notes, status, design FROM projects WHERE id = $1",
      [req.params.projectId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Proyecto no encontrado" });
    const project = result.rows[0];
    const design = project.design || { boxes: [], cables: [], devices: [] };
    const items = [];
    (design.boxes || []).forEach((box) => {
      (box.components || []).forEach((c) => {
        items.push({
          desc: c.model || c.name,
          qty: Number(c.quantity) || 1,
          unit: Number(c.unitPrice) || 0,
          total: Number(c.total) || ((Number(c.unitPrice) || 0) * (Number(c.quantity) || 1)),
        });
      });
    });
    (design.devices || []).forEach((d) => {
      items.push({ desc: d.model || d.name || 'Dispositivo', qty: 1, unit: Number(d.unitPrice) || 0, total: Number(d.total) || Number(d.unitPrice) || 0 });
    });

    const issuedBy = req.user?.email || req.user?.sub || null;
    const verificationId = randomUUID();
    const verificationIssuedAt = new Date().toISOString();
    const pdfBuffer = await buildQuotePdfBuffer(project, items, {
      taxes: 0,
      verification: {
        id: verificationId,
        issuedAt: verificationIssuedAt,
        issuedBy,
        verifyHint: `/api/projects/${project.id}/quote/verification/latest`,
      },
    });
    const pdfSha256 = createHash("sha256").update(pdfBuffer).digest("hex");
    const subtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const signatureResult = signQuoteHash(pdfSha256);
    const signatureB64 = signatureResult.signed ? signatureResult.signatureB64 : null;
    const signatureAlgorithm = signatureResult.signed ? signatureResult.algorithm : null;
    const signatureKeyId = signatureResult.signed ? signatureResult.keyId : null;

    await ensureQuoteVerificationTable();
    await query(
      `INSERT INTO quote_pdf_verifications (
         id,
         project_id,
         pdf_sha256,
         pdf_size,
         issued_by,
         metadata,
         signature_b64,
         signature_algorithm,
         signature_key_id
       )
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9)
       ON CONFLICT (project_id, pdf_sha256)
       DO UPDATE SET
         pdf_size = EXCLUDED.pdf_size,
         issued_by = EXCLUDED.issued_by,
         metadata = EXCLUDED.metadata,
         signature_b64 = COALESCE(EXCLUDED.signature_b64, quote_pdf_verifications.signature_b64),
         signature_algorithm = COALESCE(EXCLUDED.signature_algorithm, quote_pdf_verifications.signature_algorithm),
         signature_key_id = COALESCE(EXCLUDED.signature_key_id, quote_pdf_verifications.signature_key_id)`,
      [
        verificationId,
        project.id,
        pdfSha256,
        pdfBuffer.length,
        issuedBy,
        JSON.stringify({
          verificationId,
          verificationIssuedAt,
          projectStatus: project.status || "draft",
          itemsCount: items.length,
          subtotal,
          taxes: 0,
          total: subtotal,
          signature: {
            signed: Boolean(signatureB64),
            algorithm: signatureAlgorithm,
            keyId: signatureKeyId,
            reason: signatureResult.signed ? "ok" : signatureResult.reason || null,
          },
        }),
        signatureB64,
        signatureAlgorithm,
        signatureKeyId,
      ]
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="quote-${project.id}.pdf"`);
    res.setHeader("X-Quote-Sha256", pdfSha256);
    if (signatureB64) {
      res.setHeader("X-Quote-Signature", signatureB64);
      if (signatureAlgorithm) {
        res.setHeader("X-Quote-Signature-Alg", signatureAlgorithm);
      }
      if (signatureKeyId) {
        res.setHeader("X-Quote-Signature-Key-Id", signatureKeyId);
      }
    }
    res.send(pdfBuffer);
  } catch (error) {
    console.error('[projects] quote.pdf error', error && error.stack ? error.stack : error);
    if (!res.headersSent && !res.writableEnded) {
      try {
        res.status(500).json({ error: 'Error generando PDF' });
      } catch {
        // ignore
      }
    }
  }
});

projectsRouter.get("/:projectId/quote/verification/latest", async (req, res) => {
  try {
    await ensureQuoteVerificationTable();
    const projectResult = await query("SELECT id FROM projects WHERE id = $1", [req.params.projectId]);
    if (!projectResult.rows.length) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }

    const result = await query(
      `SELECT id, project_id, pdf_sha256, pdf_size, issued_by, metadata, signature_b64, signature_algorithm, signature_key_id, created_at
       FROM quote_pdf_verifications
       WHERE project_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.params.projectId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "No hay verificación registrada para este proyecto" });
    }

    const row = result.rows[0];
    res.json({
      verificationId: row.id,
      projectId: row.project_id,
      sha256: row.pdf_sha256,
      pdfSize: Number(row.pdf_size) || 0,
      issuedBy: row.issued_by,
      metadata: row.metadata || {},
      signature: row.signature_b64
        ? {
            present: true,
            algorithm: row.signature_algorithm || null,
            keyId: row.signature_key_id || null,
          }
        : {
            present: false,
            algorithm: null,
            keyId: null,
          },
      createdAt: row.created_at,
    });
  } catch (error) {
    console.error('[projects] quote latest verification error', error && error.stack ? error.stack : error);
    res.status(500).json({ error: "Error consultando verificación" });
  }
});

projectsRouter.get("/:projectId/quote/verification/public-key", async (req, res) => {
  try {
    await ensureQuoteVerificationTable();
    const projectResult = await query("SELECT id FROM projects WHERE id = $1", [req.params.projectId]);
    if (!projectResult.rows.length) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }

    const signingInfo = getQuoteSigningPublicInfo();
    if (!signingInfo.hasPublicKey || !signingInfo.publicKey) {
      return res.status(404).json({ error: "Firma digital no configurada" });
    }

    res.json({
      enabled: signingInfo.enabled,
      configured: signingInfo.configured,
      algorithm: signingInfo.algorithm,
      keyId: signingInfo.keyId,
      publicKey: signingInfo.publicKey,
      setupError: signingInfo.setupError || null,
    });
  } catch (error) {
    console.error('[projects] quote public key error', error && error.stack ? error.stack : error);
    res.status(500).json({ error: "Error consultando clave pública" });
  }
});

projectsRouter.post("/:projectId/quote/verification/verify", async (req, res) => {
  const parsed = quoteVerificationPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Payload inválido", details: parsed.error.format() });
  }

  try {
    await ensureQuoteVerificationTable();
    const projectResult = await query("SELECT id FROM projects WHERE id = $1", [req.params.projectId]);
    if (!projectResult.rows.length) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }

    let providedSha256 = normalizeSha256(parsed.data.sha256 || "");
    if (providedSha256 && !isValidSha256(providedSha256)) {
      return res.status(400).json({ error: "sha256 inválido" });
    }

    if (!providedSha256) {
      let payloadBuffer = null;
      if (parsed.data.dataUrl) {
        payloadBuffer = decodeDataUrl(parsed.data.dataUrl)?.data || null;
      } else if (parsed.data.base64) {
        payloadBuffer = decodeBase64Payload(parsed.data.base64);
      }

      if (!payloadBuffer || !payloadBuffer.length) {
        return res.status(400).json({ error: "No se pudo calcular hash del archivo recibido" });
      }

      providedSha256 = createHash("sha256").update(payloadBuffer).digest("hex");
    }

    const result = await query(
      `SELECT id, project_id, pdf_sha256, pdf_size, issued_by, metadata, signature_b64, signature_algorithm, signature_key_id, created_at
       FROM quote_pdf_verifications
       WHERE project_id = $1 AND pdf_sha256 = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [req.params.projectId, providedSha256]
    );

    if (!result.rows.length) {
      return res.json({
        valid: false,
        projectId: req.params.projectId,
        providedSha256,
        match: null,
      });
    }

    const row = result.rows[0];
    const signatureCheck = row.signature_b64
      ? verifyQuoteHashSignature({
          sha256: row.pdf_sha256,
          signatureB64: row.signature_b64,
          algorithm: row.signature_algorithm,
          keyId: row.signature_key_id,
        })
      : null;

    res.json({
      valid: true,
      projectId: row.project_id,
      providedSha256,
      match: {
        verificationId: row.id,
        sha256: row.pdf_sha256,
        pdfSize: Number(row.pdf_size) || 0,
        issuedBy: row.issued_by,
        metadata: row.metadata || {},
        signature: {
          present: Boolean(row.signature_b64),
          algorithm: row.signature_algorithm || null,
          keyId: row.signature_key_id || null,
          verified: signatureCheck ? Boolean(signatureCheck.valid) : null,
          reason: signatureCheck ? signatureCheck.reason : "not_signed",
        },
        createdAt: row.created_at,
      },
    });
  } catch (error) {
    console.error('[projects] quote verify error', error && error.stack ? error.stack : error);
    res.status(500).json({ error: "Error verificando presupuesto" });
  }
});

// Versions: create and list versions (adds a JSONB column if needed)
projectsRouter.post("/:projectId/versions", async (req, res) => {
  const parsed = versionPayloadSchema.safeParse(req.body);
  if (!parsed.success || !parsed.data.snapshot) {
    return res.status(400).json({ error: 'Snapshot requerido', details: parsed.error?.format?.() });
  }
  try {
    // ensure column exists
    await query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS versions jsonb`);
    const version = {
      id: randomUUID(),
      snapshot: parsed.data.snapshot,
      createdAt: new Date().toISOString(),
      name: parsed.data.name || null,
      notes: parsed.data.notes || null,
      status: parsed.data.status || 'draft',
      locked: Boolean(parsed.data.locked),
      author: parsed.data.author || null,
      updatedAt: new Date().toISOString(),
    };
    await query(
      `UPDATE projects SET versions = COALESCE(versions, '[]'::jsonb) || $1::jsonb WHERE id = $2`,
      [JSON.stringify(version), req.params.projectId]
    );
    res.status(201).json(version);
  } catch (error) {
    console.error('[projects] versions error', error && error.stack ? error.stack : error);
    res.status(500).json({ error: 'Error guardando versión' });
  }
});

projectsRouter.get("/:projectId/versions", async (req, res) => {
  try {
    const result = await query('SELECT versions FROM projects WHERE id = $1', [req.params.projectId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Proyecto no encontrado' });
    res.json({ versions: result.rows[0].versions || [] });
  } catch (error) {
    console.error('[projects] get versions error', error && error.stack ? error.stack : error);
    res.status(500).json({ error: 'Error leyendo versiones' });
  }
});

projectsRouter.put("/:projectId/versions/:versionId", async (req, res) => {
  const parsed = versionPayloadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.format() });
  }
  try {
    await query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS versions jsonb`);
    const { projectId, versionId } = req.params;
    const result = await query('SELECT versions FROM projects WHERE id = $1', [projectId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Proyecto no encontrado' });
    const versions = result.rows[0].versions || [];
    const nextVersions = versions.map((version) => {
      if (version.id !== versionId) return version;
      return {
        ...version,
        snapshot: parsed.data.snapshot ?? version.snapshot,
        name: parsed.data.name ?? version.name,
        notes: parsed.data.notes ?? version.notes,
        status: parsed.data.status ?? version.status,
        locked: parsed.data.locked ?? version.locked,
        author: parsed.data.author ?? version.author,
        updatedAt: new Date().toISOString(),
      };
    });
    const found = versions.some((version) => version.id === versionId);
    if (!found) return res.status(404).json({ error: 'Versión no encontrada' });
    await query('UPDATE projects SET versions = $1::jsonb WHERE id = $2', [JSON.stringify(nextVersions), projectId]);
    const updated = nextVersions.find((version) => version.id === versionId);
    res.json(updated);
  } catch (error) {
    console.error('[projects] update version error', error && error.stack ? error.stack : error);
    res.status(500).json({ error: 'Error actualizando versión' });
  }
});

projectsRouter.delete("/:projectId/versions/:versionId", async (req, res) => {
  try {
    await query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS versions jsonb`);
    const { projectId, versionId } = req.params;
    const result = await query('SELECT versions FROM projects WHERE id = $1', [projectId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Proyecto no encontrado' });
    const versions = result.rows[0].versions || [];
    const nextVersions = versions.filter((version) => version.id !== versionId);
    if (nextVersions.length === versions.length) {
      return res.status(404).json({ error: 'Versión no encontrada' });
    }
    await query('UPDATE projects SET versions = $1::jsonb WHERE id = $2', [JSON.stringify(nextVersions), projectId]);
    res.json({ ok: true });
  } catch (error) {
    console.error('[projects] delete version error', error && error.stack ? error.stack : error);
    res.status(500).json({ error: 'Error eliminando versión' });
  }
});

// Accept quote (mark project as confirmed and store acceptance info)
projectsRouter.post("/:projectId/accept", async (req, res) => {
  const who = req.body?.by || { name: 'cliente' };
  try {
    await query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS accepted_at timestamptz`);
    await query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS accepted_by jsonb`);
    const result = await query(
      `UPDATE projects SET status = 'confirmed', accepted_at = NOW(), accepted_by = $1::jsonb, updated_at = NOW() WHERE id = $2 RETURNING id, status, accepted_at, accepted_by`,
      [JSON.stringify(who), req.params.projectId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Proyecto no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[projects] accept error', error && error.stack ? error.stack : error);
    res.status(500).json({ error: 'Error al aceptar presupuesto' });
  }
});

/**
 * @openapi
 * /api/projects/{projectId}/design:
 *   put:
 *     tags:
 *       - Projects
 *     summary: Actualiza el diseño del proyecto
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               design:
 *                 type: object
 *     responses:
 *       200:
 *         description: Diseño actualizado
 */
projectsRouter.put("/:projectId/design", async (req, res) => {
  const design = req.body?.design;
  if (!design || typeof design !== "object") {
    return res.status(400).json({ error: "Diseño inválido" });
  }
  try {
    const result = await query(
      "UPDATE projects SET design = $1, updated_at = NOW() WHERE id = $2 RETURNING design",
      [design, req.params.projectId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }
    res.json({ design: result.rows[0].design || { boxes: [], cables: [] } });
  } catch (error) {
    res.status(500).json({ error: "Error guardando diseño" });
  }
});

/**
 * @openapi
 * /api/projects/{projectId}:
 *   put:
 *     tags:
 *       - Projects
 *     summary: Actualiza metadatos del proyecto
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Proyecto actualizado
 */
projectsRouter.put("/:projectId", async (req, res) => {
  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.format() });
  }
  const { name, type, client, reference, address, notes, status } = parsed.data;
  try {
    await ensureProjectColumns();
    const result = await query(
      `UPDATE projects
       SET name = $1, type = $2, client = $3, reference = $4, address = $5, notes = $6, status = $7, updated_at = NOW()
       WHERE id = $8
       RETURNING id, name, type, client, reference, address, notes, status, created_at, updated_at`,
      [name, type, client ?? null, reference ?? null, address ?? null, notes ?? null, status, req.params.projectId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error actualizando proyecto" });
  }
});

/**
 * @openapi
 * /api/projects/{projectId}:
 *   delete:
 *     tags:
 *       - Projects
 *     summary: Elimina un proyecto
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Eliminado
 *       404:
 *         description: No encontrado
 */
projectsRouter.delete("/:projectId", async (req, res) => {
  try {
    const result = await query("DELETE FROM projects WHERE id = $1", [req.params.projectId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando proyecto" });
  }
});
