import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

export const reportsRouter = Router();

reportsRouter.use(requireAuth);

const asNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampPercent = (value) => Math.min(100, Math.max(0, asNumber(value, 0)));

const roundMoney = (value) => Math.round(asNumber(value, 0) * 100) / 100;

const normalizeText = (value, fallback = "") => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || fallback;
  }
  return fallback;
};

const buildRowsFromDesign = (design = {}) => {
  const rows = [];

  (design.boxes || []).forEach((box) => {
    const boxName = normalizeText(box?.name, "Cuadro");
    (box?.components || []).forEach((component) => {
      if (component?.productActive === false) return;
      const quantity = Math.max(0, asNumber(component?.quantity, 1) || 1);
      const unitPrice = Math.max(0, asNumber(component?.unitPrice, 0));
      const discountApplied = Boolean(component?.discountApplied);
      const discountPercent = clampPercent(component?.customerDiscountPercent);
      const effectiveUnitPrice = discountApplied
        ? roundMoney(unitPrice * (1 - discountPercent / 100))
        : unitPrice;
      const total = Math.max(
        0,
        roundMoney(component?.total ?? effectiveUnitPrice * quantity)
      );

      rows.push({
        kind: "component",
        category: normalizeText(component?.category, boxName),
        model: normalizeText(component?.model, "Componente"),
        unit: "ud",
        quantity,
        unitPrice: effectiveUnitPrice,
        total,
      });
    });
  });

  (design.devices || []).forEach((device) => {
    if (device?.productActive === false) return;
    const quantity = Math.max(0, asNumber(device?.quantity, 1) || 1);
    const unitPrice = Math.max(0, asNumber(device?.unitPrice, 0));
    const discountApplied = Boolean(device?.discountApplied);
    const discountPercent = clampPercent(device?.customerDiscountPercent);
    const effectiveUnitPrice = discountApplied
      ? roundMoney(unitPrice * (1 - discountPercent / 100))
      : unitPrice;
    const total = Math.max(0, roundMoney(device?.total ?? effectiveUnitPrice * quantity));

    rows.push({
      kind: "device",
      category: normalizeText(device?.category, "Camaras"),
      model: normalizeText(device?.model || device?.name, "Dispositivo"),
      unit: "ud",
      quantity,
      unitPrice: effectiveUnitPrice,
      total,
    });
  });

  (design.cables || []).forEach((cable) => {
    const quantity = Math.max(0, asNumber(cable?.length, 0));
    const total = Math.max(0, roundMoney(cable?.totalPrice));
    const unitPrice = quantity > 0 ? roundMoney(total / quantity) : 0;
    if (quantity <= 0 && total <= 0) return;

    rows.push({
      kind: "cable",
      category: normalizeText(cable?.section, "Cableado"),
      model: normalizeText(cable?.model, "Cable"),
      unit: "m",
      quantity,
      unitPrice,
      total,
    });
  });

  return rows;
};

const aggregateRows = (rows = []) => {
  const map = new Map();
  rows.forEach((row) => {
    const key = [row.kind, row.category, row.model, row.unit].join("|");
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...row });
      return;
    }
    existing.quantity = roundMoney(existing.quantity + row.quantity);
    existing.total = roundMoney(existing.total + row.total);
  });

  const items = Array.from(map.values())
    .map((row) => ({
      ...row,
      unitPrice: row.quantity > 0 ? roundMoney(row.total / row.quantity) : roundMoney(row.unitPrice),
      quantity: roundMoney(row.quantity),
      total: roundMoney(row.total),
    }))
    .sort((a, b) => {
      const byKind = a.kind.localeCompare(b.kind);
      if (byKind !== 0) return byKind;
      const byCategory = a.category.localeCompare(b.category);
      if (byCategory !== 0) return byCategory;
      return a.model.localeCompare(b.model);
    });

  const byKindMap = new Map();
  items.forEach((item) => {
    const current = byKindMap.get(item.kind) || 0;
    byKindMap.set(item.kind, roundMoney(current + item.total));
  });

  const byKind = Array.from(byKindMap.entries()).map(([kind, total]) => ({ kind, total }));
  const totalCost = roundMoney(items.reduce((sum, item) => sum + item.total, 0));
  const totalQuantity = roundMoney(items.reduce((sum, item) => sum + item.quantity, 0));

  return {
    items,
    byKind,
    totalCost,
    totalQuantity,
  };
};

const escapeCsv = (value) => {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\n") || text.includes('"')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const toMaterialsCsv = (items = []) => {
  const header = [
    "Tipo",
    "Categoria",
    "Modelo",
    "Unidad",
    "Cantidad",
    "Precio unitario (EUR)",
    "Total (EUR)",
  ];
  const lines = [header.join(",")];

  items.forEach((item) => {
    lines.push(
      [
        item.kind,
        item.category,
        item.model,
        item.unit,
        item.quantity.toFixed(2),
        item.unitPrice.toFixed(2),
        item.total.toFixed(2),
      ]
        .map(escapeCsv)
        .join(",")
    );
  });

  return `${lines.join("\n")}\n`;
};

reportsRouter.get("/materials/:projectId", async (req, res) => {
  const { projectId } = req.params;
  const format = String(req.query.format || "json").toLowerCase();

  if (format !== "json" && format !== "csv") {
    return res.status(400).json({ error: "Formato inválido. Usa ?format=json o ?format=csv" });
  }

  try {
    const result = await query(
      "SELECT id, name, type, status, updated_at, design FROM projects WHERE id = $1",
      [projectId]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }

    const project = result.rows[0];
    const rows = buildRowsFromDesign(project.design || {});
    const aggregated = aggregateRows(rows);
    const payload = {
      project: {
        id: project.id,
        name: project.name,
        type: project.type,
        status: project.status,
        updatedAt: project.updated_at,
      },
      summary: {
        totalLines: aggregated.items.length,
        totalQuantity: aggregated.totalQuantity,
        totalCost: aggregated.totalCost,
        generatedAt: new Date().toISOString(),
      },
      byKind: aggregated.byKind,
      items: aggregated.items,
    };

    if (format === "csv") {
      const csv = toMaterialsCsv(aggregated.items);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=\"materials-${project.id}.csv\"`
      );
      return res.status(200).send(csv);
    }

    return res.json(payload);
  } catch (error) {
    console.error("[reports] materials error", error && error.stack ? error.stack : error);
    return res.status(500).json({ error: "Error generando reporte de materiales" });
  }
});
