import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { randomUUID } from "crypto";

export const projectsRouter = Router();

const projectSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  notes: z.string().optional().nullable(),
  status: z.string().optional().default("draft"),
  createdAt: z.string().optional().nullable(),
});

const parseCreatedAt = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

projectsRouter.get("/", async (req, res) => {
  try {
    const result = await query(
      "SELECT id, name, type, notes, status, created_at, updated_at FROM projects ORDER BY created_at DESC"
    );
    res.json({ items: result.rows });
  } catch (error) {
    res.status(500).json({ error: "Error listando proyectos" });
  }
});

projectsRouter.post("/", async (req, res) => {
  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.format() });
  }

  const { name, type, notes, status, createdAt } = parsed.data;
  const id = randomUUID();
  try {
    const createdAtValue = parseCreatedAt(createdAt);
    const result = await query(
      `INSERT INTO projects (id, name, type, notes, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, NOW()), NOW())
       RETURNING id, name, type, notes, status, created_at, updated_at`,
      [id, name, type, notes ?? null, status, createdAtValue]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error creando proyecto" });
  }
});

projectsRouter.get("/:projectId", async (req, res) => {
  try {
    const result = await query(
      "SELECT id, name, type, notes, status, created_at, updated_at FROM projects WHERE id = $1",
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

projectsRouter.put("/:projectId", async (req, res) => {
  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.format() });
  }
  const { name, type, notes, status } = parsed.data;
  try {
    const result = await query(
      `UPDATE projects
       SET name = $1, type = $2, notes = $3, status = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING id, name, type, notes, status, created_at, updated_at`,
      [name, type, notes ?? null, status, req.params.projectId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error actualizando proyecto" });
  }
});

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
