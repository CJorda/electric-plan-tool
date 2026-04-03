import { Router } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { ensureOperationsTables, query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

export const operationsRouter = Router();

operationsRouter.use(requireAuth);

const jsonRecordSchema = z.record(z.any()).default({});

const moduleConfigs = {
  inventory: {
    table: "inventory_items",
    orderBy: "updated_at DESC",
    searchFields: ["sku", "name", "category", "location"],
    numericFields: ["min_stock", "current_stock", "cost_price", "sale_price"],
    schema: z.object({
      sku: z.string().min(1),
      name: z.string().min(1),
      category: z.string().optional().nullable(),
      unit: z.string().min(1).default("ud"),
      min_stock: z.number().min(0).default(0),
      current_stock: z.number().min(0).default(0),
      cost_price: z.number().min(0).default(0),
      sale_price: z.number().min(0).default(0),
      location: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
    }),
  },
  purchases: {
    table: "purchase_orders",
    orderBy: "created_at DESC",
    searchFields: ["supplier", "status", "currency", "notes"],
    numericFields: ["total_amount"],
    schema: z.object({
      supplier: z.string().min(1),
      status: z.enum(["draft", "requested", "approved", "received", "cancelled"]).default("draft"),
      expected_date: z.string().optional().nullable(),
      total_amount: z.number().min(0).default(0),
      currency: z.string().min(1).default("EUR"),
      notes: z.string().optional().nullable(),
    }),
  },
  reports: {
    table: "saved_reports",
    orderBy: "updated_at DESC",
    searchFields: ["name", "type"],
    schema: z.object({
      name: z.string().min(1),
      type: z.string().min(1),
      filters: jsonRecordSchema,
      last_run_at: z.string().optional().nullable(),
    }),
  },
  approvals: {
    table: "approvals",
    orderBy: "created_at DESC",
    searchFields: ["entity_type", "entity_id", "requested_by", "status", "approved_by"],
    schema: z.object({
      entity_type: z.string().min(1),
      entity_id: z.string().min(1),
      requested_by: z.string().min(1),
      status: z.enum(["pending", "approved", "rejected"]).default("pending"),
      approved_by: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
    }),
  },
  planning: {
    table: "planning_tasks",
    orderBy: "due_date NULLS LAST, created_at DESC",
    searchFields: ["title", "project_id", "assignee", "priority", "status", "notes"],
    schema: z.object({
      title: z.string().min(1),
      project_id: z.string().optional().nullable(),
      assignee: z.string().optional().nullable(),
      start_date: z.string().optional().nullable(),
      due_date: z.string().optional().nullable(),
      priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
      status: z.enum(["todo", "in_progress", "blocked", "done"]).default("todo"),
      notes: z.string().optional().nullable(),
    }),
  },
  labor: {
    table: "labor_rates",
    orderBy: "updated_at DESC",
    searchFields: ["role", "notes"],
    numericFields: ["hourly_rate", "overtime_rate"],
    schema: z.object({
      role: z.string().min(1),
      hourly_rate: z.number().min(0).default(0),
      overtime_rate: z.number().min(0).default(0),
      active: z.boolean().default(true),
      notes: z.string().optional().nullable(),
    }),
  },
  templates: {
    table: "project_templates",
    orderBy: "updated_at DESC",
    searchFields: ["name", "description", "default_type", "default_status"],
    schema: z.object({
      name: z.string().min(1),
      description: z.string().optional().nullable(),
      default_type: z.string().optional().nullable(),
      default_status: z.string().optional().nullable(),
      template_data: jsonRecordSchema,
    }),
  },
  audit: {
    table: "audit_events",
    orderBy: "created_at DESC",
    searchFields: ["action", "entity_type", "entity_id", "actor", "severity"],
    readOnly: true,
    schema: z.object({
      action: z.string().min(1),
      entity_type: z.string().min(1),
      entity_id: z.string().optional().nullable(),
      actor: z.string().optional().nullable(),
      severity: z.enum(["info", "warning", "error"]).default("info"),
      details: jsonRecordSchema,
    }),
  },
  integrations: {
    table: "integrations",
    orderBy: "updated_at DESC",
    searchFields: ["name", "provider", "base_url", "status"],
    schema: z.object({
      name: z.string().min(1),
      provider: z.string().min(1),
      base_url: z.string().optional().nullable(),
      api_key_masked: z.string().optional().nullable(),
      status: z.enum(["inactive", "active", "error"]).default("inactive"),
      config: jsonRecordSchema,
      last_sync_at: z.string().optional().nullable(),
    }),
  },
  settings: {
    table: "advanced_settings",
    orderBy: "updated_at DESC",
    searchFields: ["setting_key", "scope"],
    schema: z.object({
      setting_key: z.string().min(1),
      setting_value: z.any(),
      scope: z.string().min(1).default("global"),
    }),
  },
};

const getConfig = (moduleId) => moduleConfigs[moduleId];

const getActor = (req) => req.user?.email || req.user?.sub || "system";

const toBoundedInteger = (value, fallback, min, max) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

const createAuditDetails = (details) => {
  if (!details || typeof details !== "object") return {};
  const next = { ...details };
  if (typeof next.api_key_masked === "string" && next.api_key_masked.length > 6) {
    next.api_key_masked = `${next.api_key_masked.slice(0, 4)}***`;
  }
  return next;
};

const appendAuditEvent = async ({ action, moduleId, recordId, actor, details }) => {
  await query(
    `
      INSERT INTO audit_events (id, action, entity_type, entity_id, actor, severity, details)
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
    `,
    [
      randomUUID(),
      action,
      moduleId,
      recordId || null,
      actor,
      "info",
      JSON.stringify(createAuditDetails(details)),
    ]
  );
};

const parseModulePayload = (config, payload, { partial = false } = {}) => {
  const schema = partial ? config.schema.partial() : config.schema;
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return parsed;
  if (partial && Object.keys(parsed.data).length === 0) {
    return {
      success: false,
      error: {
        format: () => ({ _errors: ["No hay campos para actualizar"] }),
      },
    };
  }
  return parsed;
};

const normalizeRow = (config, row) => {
  if (!row) return row;
  const next = { ...row };
  (config.numericFields || []).forEach((field) => {
    if (next[field] !== null && next[field] !== undefined) {
      next[field] = Number(next[field]);
    }
  });
  return next;
};

operationsRouter.get("/meta", (req, res) => {
  res.json({
    modules: Object.entries(moduleConfigs).map(([id, config]) => ({
      id,
      readOnly: Boolean(config.readOnly),
    })),
  });
});

operationsRouter.get("/:moduleId", async (req, res) => {
  const config = getConfig(req.params.moduleId);
  if (!config) {
    return res.status(404).json({ error: "Módulo no encontrado" });
  }
  try {
    await ensureOperationsTables();
    const queryText = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const limit = toBoundedInteger(req.query.limit, 500, 1, 500);
    const offset = toBoundedInteger(req.query.offset, 0, 0, 1000000);
    const params = [];
    let whereClause = "";
    if (queryText && Array.isArray(config.searchFields) && config.searchFields.length > 0) {
      params.push(`%${queryText}%`);
      const searchExpression = config.searchFields
        .map((field) => `${field}::text ILIKE $1`)
        .join(" OR ");
      whereClause = ` WHERE (${searchExpression})`;
    }
    const limitParam = `$${params.length + 1}`;
    const offsetParam = `$${params.length + 2}`;
    params.push(limit, offset);
    const result = await query(
      `
        SELECT *
        FROM ${config.table}
        ${whereClause}
        ORDER BY ${config.orderBy}
        LIMIT ${limitParam} OFFSET ${offsetParam}
      `,
      params
    );
    return res.json({ items: result.rows.map((row) => normalizeRow(config, row)) });
  } catch {
    return res.status(500).json({ error: "Error listando registros" });
  }
});

operationsRouter.post("/:moduleId", async (req, res) => {
  const config = getConfig(req.params.moduleId);
  if (!config) {
    return res.status(404).json({ error: "Módulo no encontrado" });
  }
  if (config.readOnly) {
    return res.status(403).json({ error: "Módulo de solo lectura" });
  }

  const parsed = parseModulePayload(config, req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.format() });
  }

  const payload = parsed.data;
  const id = randomUUID();
  const columns = Object.keys(payload);
  const values = Object.values(payload);

  try {
    await ensureOperationsTables();
    const placeholders = columns.map((_, idx) => `$${idx + 2}`).join(", ");
    const fields = columns.length > 0 ? `, ${columns.join(", ")}` : "";
    const sql = `
      INSERT INTO ${config.table} (id${fields})
      VALUES ($1${placeholders ? `, ${placeholders}` : ""})
      RETURNING *
    `;
    const result = await query(sql, [id, ...values]);
    const created = normalizeRow(config, result.rows[0]);
    await appendAuditEvent({
      action: "create",
      moduleId: req.params.moduleId,
      recordId: created.id,
      actor: getActor(req),
      details: created,
    });
    return res.status(201).json(created);
  } catch (error) {
    if (error?.code === "23505") {
      return res.status(409).json({ error: "Ya existe un registro con esos datos únicos" });
    }
    return res.status(500).json({ error: "Error creando registro" });
  }
});

operationsRouter.put("/:moduleId/:recordId", async (req, res) => {
  const config = getConfig(req.params.moduleId);
  if (!config) {
    return res.status(404).json({ error: "Módulo no encontrado" });
  }
  if (config.readOnly) {
    return res.status(403).json({ error: "Módulo de solo lectura" });
  }

  const parsed = parseModulePayload(config, req.body, { partial: true });
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.format() });
  }

  const payload = parsed.data;
  const columns = Object.keys(payload);
  const values = Object.values(payload);

  try {
    await ensureOperationsTables();
    const sets = columns.map((column, idx) => `${column} = $${idx + 1}`);
    if (sets.includes("updated_at")) {
      return res.status(400).json({ error: "Campo actualizado automáticamente" });
    }
    sets.push(`updated_at = NOW()`);
    const sql = `
      UPDATE ${config.table}
      SET ${sets.join(", ")}
      WHERE id = $${columns.length + 1}
      RETURNING *
    `;
    const result = await query(sql, [...values, req.params.recordId]);
    if (!result.rows.length) {
      return res.status(404).json({ error: "Registro no encontrado" });
    }
    const updated = normalizeRow(config, result.rows[0]);
    await appendAuditEvent({
      action: "update",
      moduleId: req.params.moduleId,
      recordId: req.params.recordId,
      actor: getActor(req),
      details: payload,
    });
    return res.json(updated);
  } catch (error) {
    if (error?.code === "23505") {
      return res.status(409).json({ error: "Ya existe un registro con esos datos únicos" });
    }
    return res.status(500).json({ error: "Error actualizando registro" });
  }
});

operationsRouter.delete("/:moduleId/:recordId", async (req, res) => {
  const config = getConfig(req.params.moduleId);
  if (!config) {
    return res.status(404).json({ error: "Módulo no encontrado" });
  }
  if (config.readOnly) {
    return res.status(403).json({ error: "Módulo de solo lectura" });
  }

  try {
    await ensureOperationsTables();
    const result = await query(`DELETE FROM ${config.table} WHERE id = $1`, [req.params.recordId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Registro no encontrado" });
    }
    await appendAuditEvent({
      action: "delete",
      moduleId: req.params.moduleId,
      recordId: req.params.recordId,
      actor: getActor(req),
      details: { id: req.params.recordId },
    });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: "Error eliminando registro" });
  }
});
