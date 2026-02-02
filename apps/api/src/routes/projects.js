import { Router } from "express";
import { z } from "zod";
import { query, ensureProjectAttachmentsTable } from "../db.js";
import { randomUUID } from "crypto";
import { streamQuotePdf } from "../lib/quotePdf.js";
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
    const result = await query("SELECT id, name, type, notes, status, design FROM projects WHERE id = $1", [req.params.projectId]);
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
    const result = await query("SELECT id, name, type, notes, status, design FROM projects WHERE id = $1", [req.params.projectId]);
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

    await streamQuotePdf(res, project, items, { taxes: 0 });
  } catch (error) {
    console.error('[projects] quote.pdf error', error && error.stack ? error.stack : error);
    try { res.status(500).json({ error: 'Error generando PDF' }); } catch (e) { /* ignore */ }
  }
});

// Versions: create and list versions (adds a JSONB column if needed)
projectsRouter.post("/:projectId/versions", async (req, res) => {
  const snapshot = req.body?.snapshot;
  if (!snapshot) return res.status(400).json({ error: 'Snapshot requerido' });
  try {
    // ensure column exists
    await query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS versions jsonb`);
    const version = { id: randomUUID(), snapshot, createdAt: new Date().toISOString() };
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
