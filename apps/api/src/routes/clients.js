import { randomUUID } from "crypto";
import { Router } from "express";
import { z } from "zod";
import { ensureClientsTable, query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

export const clientsRouter = Router();

clientsRouter.use(requireAuth);

const optionalTextSchema = z.union([z.string(), z.null(), z.undefined()]);
const optionalEmailSchema = z.union([z.string().email(), z.literal(""), z.null(), z.undefined()]);

const clientSchema = z.object({
  name: z.string().min(1),
  contactName: optionalTextSchema,
  email: optionalEmailSchema,
  phone: optionalTextSchema,
  address: optionalTextSchema,
  notes: optionalTextSchema,
});

const normalizeNullableText = (value) => {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
};

const mapClientRow = (row) => ({
  id: row.id,
  name: row.name,
  contactName: row.contact_name ?? "",
  email: row.email ?? "",
  phone: row.phone ?? "",
  address: row.address ?? "",
  notes: row.notes ?? "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * @openapi
 * /api/clients:
 *   get:
 *     tags:
 *       - Clients
 *     summary: Lista clientes
 *     responses:
 *       200:
 *         description: Lista de clientes
 */
clientsRouter.get("/", async (req, res) => {
  try {
    await ensureClientsTable();
    const result = await query(
      `SELECT id, name, contact_name, email, phone, address, notes, created_at, updated_at
       FROM clients
       ORDER BY created_at DESC`
    );
    res.json({ items: result.rows.map(mapClientRow) });
  } catch {
    res.status(500).json({ error: "Error listando clientes" });
  }
});

/**
 * @openapi
 * /api/clients:
 *   post:
 *     tags:
 *       - Clients
 *     summary: Crea un cliente
 *     responses:
 *       201:
 *         description: Cliente creado
 */
clientsRouter.post("/", async (req, res) => {
  const parsed = clientSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos invalidos", details: parsed.error.format() });
  }

  const name = String(parsed.data.name || "").trim();
  const contactName = normalizeNullableText(parsed.data.contactName);
  const email = normalizeNullableText(parsed.data.email);
  const phone = normalizeNullableText(parsed.data.phone);
  const address = normalizeNullableText(parsed.data.address);
  const notes = normalizeNullableText(parsed.data.notes);

  if (!name) {
    return res.status(400).json({ error: "El nombre del cliente es obligatorio" });
  }

  try {
    await ensureClientsTable();
    const result = await query(
      `INSERT INTO clients (id, name, contact_name, email, phone, address, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, contact_name, email, phone, address, notes, created_at, updated_at`,
      [randomUUID(), name, contactName, email, phone, address, notes]
    );
    res.status(201).json(mapClientRow(result.rows[0]));
  } catch {
    res.status(500).json({ error: "Error creando cliente" });
  }
});

/**
 * @openapi
 * /api/clients/{clientId}:
 *   put:
 *     tags:
 *       - Clients
 *     summary: Actualiza un cliente
 *     responses:
 *       200:
 *         description: Cliente actualizado
 */
clientsRouter.put("/:clientId", async (req, res) => {
  const parsed = clientSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos invalidos", details: parsed.error.format() });
  }

  const name = String(parsed.data.name || "").trim();
  const contactName = normalizeNullableText(parsed.data.contactName);
  const email = normalizeNullableText(parsed.data.email);
  const phone = normalizeNullableText(parsed.data.phone);
  const address = normalizeNullableText(parsed.data.address);
  const notes = normalizeNullableText(parsed.data.notes);

  if (!name) {
    return res.status(400).json({ error: "El nombre del cliente es obligatorio" });
  }

  try {
    await ensureClientsTable();
    const result = await query(
      `UPDATE clients
       SET name = $1,
           contact_name = $2,
           email = $3,
           phone = $4,
           address = $5,
           notes = $6,
           updated_at = NOW()
       WHERE id = $7
       RETURNING id, name, contact_name, email, phone, address, notes, created_at, updated_at`,
      [name, contactName, email, phone, address, notes, req.params.clientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json(mapClientRow(result.rows[0]));
  } catch {
    res.status(500).json({ error: "Error actualizando cliente" });
  }
});

/**
 * @openapi
 * /api/clients/{clientId}:
 *   delete:
 *     tags:
 *       - Clients
 *     summary: Elimina un cliente
 *     responses:
 *       200:
 *         description: Cliente eliminado
 */
clientsRouter.delete("/:clientId", async (req, res) => {
  try {
    await ensureClientsTable();
    const result = await query("DELETE FROM clients WHERE id = $1", [req.params.clientId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Error eliminando cliente" });
  }
});
