import { Router } from "express";
import { z } from "zod";
import { query } from "../db.js";
import { randomUUID } from "crypto";

export const catalogRouter = Router();

const categorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
});

const productSchema = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
  serial: z.string().optional().nullable(),
  distributorPrice: z.number().min(0).optional().default(0),
  discountPrice: z.number().min(0).optional().default(0),
  shippingCost: z.number().min(0).optional().default(0),
  leadTime: z.string().optional().nullable(),
});

const mapCategoryRow = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description ?? "",
});

const mapProductRow = (row) => ({
  id: row.id,
  category: row.category,
  name: row.name,
  serial: row.serial ?? "",
  distributorPrice: Number(row.distributor_price) || 0,
  discountPrice: Number(row.discount_price) || 0,
  shippingCost: Number(row.shipping_cost) || 0,
  leadTime: row.lead_time ?? "",
});

catalogRouter.get("/categories", async (req, res) => {
  try {
    const result = await query(
      "SELECT id, name, description FROM categories ORDER BY created_at DESC"
    );
    res.json({ items: result.rows.map(mapCategoryRow) });
  } catch (error) {
    res.status(500).json({ error: "Error listando categorías" });
  }
});

catalogRouter.post("/categories", async (req, res) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.format() });
  }
  const { name, description } = parsed.data;
  const id = randomUUID();
  try {
    const result = await query(
      `INSERT INTO categories (id, name, description)
       VALUES ($1, $2, $3)
       RETURNING id, name, description`,
      [id, name, description ?? null]
    );
    res.status(201).json(mapCategoryRow(result.rows[0]));
  } catch (error) {
    res.status(500).json({ error: "Error creando categoría" });
  }
});

catalogRouter.put("/categories/:categoryId", async (req, res) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.format() });
  }
  const { name, description } = parsed.data;
  try {
    const result = await query(
      `UPDATE categories
       SET name = $1, description = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, description`,
      [name, description ?? null, req.params.categoryId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }
    res.json(mapCategoryRow(result.rows[0]));
  } catch (error) {
    res.status(500).json({ error: "Error actualizando categoría" });
  }
});

catalogRouter.delete("/categories/:categoryId", async (req, res) => {
  try {
    await query("DELETE FROM products WHERE category_id = $1", [req.params.categoryId]);
    const result = await query("DELETE FROM categories WHERE id = $1", [req.params.categoryId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando categoría" });
  }
});

catalogRouter.get("/products", async (req, res) => {
  try {
    const result = await query(
      `SELECT p.id, p.name, p.serial, p.distributor_price, p.discount_price,
              p.shipping_cost, p.lead_time, c.name AS category
       FROM products p
       JOIN categories c ON c.id = p.category_id
       ORDER BY p.created_at DESC`
    );
    res.json({ items: result.rows.map(mapProductRow) });
  } catch (error) {
    res.status(500).json({ error: "Error listando productos" });
  }
});

catalogRouter.post("/products", async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.format() });
  }
  const { category, name, serial, distributorPrice, discountPrice, shippingCost, leadTime } = parsed.data;
  try {
    const categoryResult = await query("SELECT id FROM categories WHERE name = $1", [category]);
    if (categoryResult.rows.length === 0) {
      return res.status(400).json({ error: "Categoría no encontrada" });
    }
    const id = randomUUID();
    const result = await query(
      `INSERT INTO products
        (id, category_id, name, serial, distributor_price, discount_price, shipping_cost, lead_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, serial, distributor_price, discount_price, shipping_cost, lead_time`,
      [
        id,
        categoryResult.rows[0].id,
        name,
        serial ?? null,
        distributorPrice ?? 0,
        discountPrice ?? 0,
        shippingCost ?? 0,
        leadTime ?? null,
      ]
    );
    res.status(201).json(mapProductRow({ ...result.rows[0], category }));
  } catch (error) {
    res.status(500).json({ error: "Error creando producto" });
  }
});

catalogRouter.put("/products/:productId", async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.format() });
  }
  const { category, name, serial, distributorPrice, discountPrice, shippingCost, leadTime } = parsed.data;
  try {
    const categoryResult = await query("SELECT id FROM categories WHERE name = $1", [category]);
    if (categoryResult.rows.length === 0) {
      return res.status(400).json({ error: "Categoría no encontrada" });
    }
    const result = await query(
      `UPDATE products
       SET category_id = $1,
           name = $2,
           serial = $3,
           distributor_price = $4,
           discount_price = $5,
           shipping_cost = $6,
           lead_time = $7,
           updated_at = NOW()
       WHERE id = $8
       RETURNING id, name, serial, distributor_price, discount_price, shipping_cost, lead_time`,
      [
        categoryResult.rows[0].id,
        name,
        serial ?? null,
        distributorPrice ?? 0,
        discountPrice ?? 0,
        shippingCost ?? 0,
        leadTime ?? null,
        req.params.productId,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.json(mapProductRow({ ...result.rows[0], category }));
  } catch (error) {
    res.status(500).json({ error: "Error actualizando producto" });
  }
});

catalogRouter.get("/suppliers", (req, res) => {
  res.status(501).json({ error: "Proveedores pendientes" });
});
