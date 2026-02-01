import { Router } from "express";
import { z } from "zod";
import { ensureCatalogTables, query } from "../db.js";
import { randomUUID } from "crypto";
import { requireAuth } from "../middleware/auth.js";

export const catalogRouter = Router();

catalogRouter.use(requireAuth);

const categorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
});

const productSchema = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
  manufacturer: z.string().optional().nullable(),
  distributorId: z.string().optional().nullable(),
  serial: z.string().optional().nullable(),
  distributorPrice: z.number().min(0).optional().default(0),
  discountPrice: z.number().min(0).optional().default(0),
  shippingCost: z.number().min(0).optional().default(0),
  leadTime: z.string().optional().nullable(),
});

const providerSchema = z.object({
  name: z.string().min(1),
  contactName: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const manufacturerSchema = z.object({
  name: z.string().min(1),
  contactName: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const marginSchema = z.object({
  providerId: z.string().min(1),
  categoryId: z.string().min(1),
  marginPercent: z.number().min(0).max(100).default(0),
});

const templateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
});

const templateMarginSchema = z.object({
  categoryId: z.string().min(1),
  marginPercent: z.number().min(0).max(100).default(0),
});

const mapCategoryRow = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description ?? "",
  parentId: row.parent_id ?? null,
});

const mapProductRow = (row) => ({
  id: row.id,
  category: row.category,
  name: row.name,
  manufacturer: row.manufacturer ?? "",
  distributorId: row.distributor_id ?? "",
  distributorName: row.distributor_name ?? "",
  serial: row.serial ?? "",
  distributorPrice: Number(row.distributor_price) || 0,
  discountPrice: Number(row.discount_price) || 0,
  shippingCost: Number(row.shipping_cost) || 0,
  leadTime: row.lead_time ?? "",
});

const mapPriceHistoryRow = (row) => ({
  id: row.id,
  distributorPrice: Number(row.distributor_price) || 0,
  discountPrice: Number(row.discount_price) || 0,
  shippingCost: Number(row.shipping_cost) || 0,
  currency: row.currency || "EUR",
  note: row.note ?? "",
  createdAt: row.created_at,
});

const mapProviderRow = (row) => ({
  id: row.id,
  name: row.name,
  contactName: row.contact_name ?? "",
  email: row.email ?? "",
  phone: row.phone ?? "",
  website: row.website ?? "",
  notes: row.notes ?? "",
});

const mapManufacturerRow = (row) => ({
  id: row.id,
  name: row.name,
  contactName: row.contact_name ?? "",
  email: row.email ?? "",
  phone: row.phone ?? "",
  website: row.website ?? "",
  notes: row.notes ?? "",
});

const mapTemplateRow = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description ?? "",
});

/**
 * @openapi
 * /api/catalog/categories:
 *   get:
 *     tags:
 *       - Catalog
 *     summary: Lista categorías
 *     responses:
 *       200:
 *         description: Lista de categorías
 */
catalogRouter.get("/categories", async (req, res) => {
  try {
    await ensureCatalogTables();
    const result = await query(
      "SELECT id, name, description, parent_id FROM categories ORDER BY created_at DESC"
    );
    res.json({ items: result.rows.map(mapCategoryRow) });
  } catch (error) {
    res.status(500).json({ error: "Error listando categorías" });
  }
});

/**
 * @openapi
 * /api/catalog/categories:
 *   post:
 *     tags:
 *       - Catalog
 *     summary: Crea una categoría
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Categoría creada
 */
catalogRouter.post("/categories", async (req, res) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.format() });
  }
  const { name, description, parentId } = parsed.data;
  const id = randomUUID();
  try {
    await ensureCatalogTables();
    if (parentId) {
      const parentCheck = await query("SELECT id FROM categories WHERE id = $1", [parentId]);
      if (parentCheck.rows.length === 0) {
        return res.status(400).json({ error: "Categoría padre no encontrada" });
      }
    }
    const result = await query(
      `INSERT INTO categories (id, name, description, parent_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, description, parent_id`,
      [id, name, description ?? null, parentId ?? null]
    );
    res.status(201).json(mapCategoryRow(result.rows[0]));
  } catch (error) {
    res.status(500).json({ error: "Error creando categoría" });
  }
});

/**
 * @openapi
 * /api/catalog/categories/{categoryId}:
 *   put:
 *     tags:
 *       - Catalog
 *     summary: Actualiza una categoría
 *     parameters:
 *       - in: path
 *         name: categoryId
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
 *     responses:
 *       200:
 *         description: Categoría actualizada
 */
catalogRouter.put("/categories/:categoryId", async (req, res) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.format() });
  }
  const { name, description, parentId } = parsed.data;
  try {
    await ensureCatalogTables();
    if (parentId && parentId === req.params.categoryId) {
      return res.status(400).json({ error: "La categoría padre no puede ser la misma" });
    }
    if (parentId) {
      const parentCheck = await query("SELECT id FROM categories WHERE id = $1", [parentId]);
      if (parentCheck.rows.length === 0) {
        return res.status(400).json({ error: "Categoría padre no encontrada" });
      }
    }
    const result = await query(
      `UPDATE categories
       SET name = $1, description = $2, parent_id = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING id, name, description, parent_id`,
      [name, description ?? null, parentId ?? null, req.params.categoryId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Categoría no encontrada" });
    }
    res.json(mapCategoryRow(result.rows[0]));
  } catch (error) {
    res.status(500).json({ error: "Error actualizando categoría" });
  }
});

/**
 * @openapi
 * /api/catalog/categories/{categoryId}:
 *   delete:
 *     tags:
 *       - Catalog
 *     summary: Elimina una categoría y sus productos
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Eliminado
 */
catalogRouter.delete("/categories/:categoryId", async (req, res) => {
  try {
    await ensureCatalogTables();
    const children = await query("SELECT 1 FROM categories WHERE parent_id = $1 LIMIT 1", [
      req.params.categoryId,
    ]);
    if (children.rows.length > 0) {
      return res.status(400).json({ error: "La categoría tiene subcategorías" });
    }
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

/**
 * @openapi
 * /api/catalog/products:
 *   get:
 *     tags:
 *       - Catalog
 *     summary: Lista productos
 *     responses:
 *       200:
 *         description: Lista de productos
 */
catalogRouter.get("/products", async (req, res) => {
  try {
    const result = await query(
            `SELECT p.id, p.name, p.manufacturer, p.distributor_id, p.serial, p.distributor_price, p.discount_price,
              p.shipping_cost, p.lead_time, c.name AS category, pr.name AS distributor_name
       FROM products p
       JOIN categories c ON c.id = p.category_id
       LEFT JOIN providers pr ON pr.id = p.distributor_id
       ORDER BY p.created_at DESC`
    );
    res.json({ items: result.rows.map(mapProductRow) });
  } catch (error) {
    res.status(500).json({ error: "Error listando productos" });
  }
});

/**
 * @openapi
 * /api/catalog/products:
 *   post:
 *     tags:
 *       - Catalog
 *     summary: Crea un producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *               name:
 *                 type: string
 *               manufacturer:
 *                 type: string
 *               distributorId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Producto creado
 */
catalogRouter.post("/products", async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.format() });
  }
  const {
    category,
    name,
    manufacturer,
    distributorId,
    serial,
    distributorPrice,
    discountPrice,
    shippingCost,
    leadTime,
  } = parsed.data;
  try {
    const categoryResult = await query("SELECT id FROM categories WHERE name = $1", [category]);
    if (categoryResult.rows.length === 0) {
      return res.status(400).json({ error: "Categoría no encontrada" });
    }
    let distributorName = "";
    let distributorIdValue = distributorId ?? null;
    if (distributorIdValue) {
      const distributorRes = await query("SELECT id, name FROM providers WHERE id = $1", [distributorIdValue]);
      if (distributorRes.rows.length === 0) {
        return res.status(400).json({ error: "Distribuidor no encontrado" });
      }
      distributorName = distributorRes.rows[0].name;
    }
    const id = randomUUID();
    const result = await query(
      `INSERT INTO products
        (id, category_id, name, manufacturer, distributor_id, serial, distributor_price, discount_price, shipping_cost, lead_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, name, manufacturer, distributor_id, serial, distributor_price, discount_price, shipping_cost, lead_time`,
      [
        id,
        categoryResult.rows[0].id,
        name,
        manufacturer ?? null,
        distributorIdValue,
        serial ?? null,
        distributorPrice ?? 0,
        discountPrice ?? 0,
        shippingCost ?? 0,
        leadTime ?? null,
      ]
    );
    await query(
      `INSERT INTO product_price_history
        (id, product_id, distributor_price, discount_price, shipping_cost, note)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [randomUUID(), id, distributorPrice ?? 0, discountPrice ?? 0, shippingCost ?? 0, "Creación"]
    );
    res.status(201).json(
      mapProductRow({
        ...result.rows[0],
        category,
        distributor_name: distributorName,
      })
    );
  } catch (error) {
    res.status(500).json({ error: "Error creando producto" });
  }
});

/**
 * @openapi
 * /api/catalog/products/{productId}:
 *   put:
 *     tags:
 *       - Catalog
 *     summary: Actualiza un producto
 *     parameters:
 *       - in: path
 *         name: productId
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
 *               manufacturer:
 *                 type: string
 *               distributorId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Producto actualizado
 */
catalogRouter.put("/products/:productId", async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.format() });
  }
  const {
    category,
    name,
    manufacturer,
    distributorId,
    serial,
    distributorPrice,
    discountPrice,
    shippingCost,
    leadTime,
  } = parsed.data;
  try {
    const categoryResult = await query("SELECT id FROM categories WHERE name = $1", [category]);
    if (categoryResult.rows.length === 0) {
      return res.status(400).json({ error: "Categoría no encontrada" });
    }
    let distributorName = "";
    let distributorIdValue = distributorId ?? null;
    if (distributorIdValue) {
      const distributorRes = await query("SELECT id, name FROM providers WHERE id = $1", [distributorIdValue]);
      if (distributorRes.rows.length === 0) {
        return res.status(400).json({ error: "Distribuidor no encontrado" });
      }
      distributorName = distributorRes.rows[0].name;
    }
    const currentResult = await query(
      "SELECT distributor_price, discount_price, shipping_cost FROM products WHERE id = $1",
      [req.params.productId]
    );
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    const result = await query(
      `UPDATE products
       SET category_id = $1,
           name = $2,
           manufacturer = $3,
           distributor_id = $4,
           serial = $5,
           distributor_price = $6,
           discount_price = $7,
           shipping_cost = $8,
           lead_time = $9,
           updated_at = NOW()
       WHERE id = $10
       RETURNING id, name, manufacturer, distributor_id, serial, distributor_price, discount_price, shipping_cost, lead_time`,
      [
        categoryResult.rows[0].id,
        name,
        manufacturer ?? null,
        distributorIdValue,
        serial ?? null,
        distributorPrice ?? 0,
        discountPrice ?? 0,
        shippingCost ?? 0,
        leadTime ?? null,
        req.params.productId,
      ]
    );
    const current = currentResult.rows[0];
    const priceChanged =
      Number(current.distributor_price) !== Number(distributorPrice ?? 0) ||
      Number(current.discount_price) !== Number(discountPrice ?? 0) ||
      Number(current.shipping_cost) !== Number(shippingCost ?? 0);
    if (priceChanged) {
      await query(
        `INSERT INTO product_price_history
          (id, product_id, distributor_price, discount_price, shipping_cost, note)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          randomUUID(),
          req.params.productId,
          distributorPrice ?? 0,
          discountPrice ?? 0,
          shippingCost ?? 0,
          "Actualización",
        ]
      );
    }
    res.json(
      mapProductRow({
        ...result.rows[0],
        category,
        distributor_name: distributorName,
      })
    );
  } catch (error) {
    res.status(500).json({ error: "Error actualizando producto" });
  }
});

// Product price history
/**
 * @openapi
 * /api/catalog/products/{productId}/prices:
 *   get:
 *     tags:
 *       - Catalog
 *     summary: Historial de precios de un producto
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de cambios de precio
 */
catalogRouter.get("/products/:productId/prices", async (req, res) => {
  try {
    const result = await query(
      `SELECT id, distributor_price, discount_price, shipping_cost, currency, note, created_at
       FROM product_price_history
       WHERE product_id = $1
       ORDER BY created_at DESC`,
      [req.params.productId]
    );
    res.json({ items: result.rows.map(mapPriceHistoryRow) });
  } catch (error) {
    res.status(500).json({ error: "Error listando historial de precios" });
  }
});

catalogRouter.get("/suppliers", (req, res) => {
  res.status(501).json({ error: "Proveedores pendientes" });
});

// Providers
catalogRouter.get("/providers", async (req, res) => {
  try {
    await ensureCatalogTables();
    const result = await query(
      "SELECT id, name, contact_name, email, phone, website, notes FROM providers ORDER BY created_at DESC"
    );
    res.json({ items: result.rows.map(mapProviderRow) });
  } catch (error) {
    res.status(500).json({ error: "Error listando proveedores" });
  }
});

catalogRouter.post("/providers", async (req, res) => {
  const parsed = providerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.format() });
  }
  const id = randomUUID();
  try {
    await ensureCatalogTables();
    const existing = await query("SELECT id FROM providers WHERE name = $1", [parsed.data.name]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Proveedor ya existe" });
    }
    const result = await query(
      `INSERT INTO providers (id, name, contact_name, email, phone, website, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, contact_name, email, phone, website, notes`,
      [
        id,
        parsed.data.name,
        parsed.data.contactName ?? null,
        parsed.data.email ?? null,
        parsed.data.phone ?? null,
        parsed.data.website ?? null,
        parsed.data.notes ?? null,
      ]
    );
    res.status(201).json(mapProviderRow(result.rows[0]));
  } catch (error) {
    res.status(500).json({ error: "Error creando proveedor" });
  }
});

catalogRouter.put("/providers/:providerId", async (req, res) => {
  const parsed = providerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.format() });
  }
  try {
    await ensureCatalogTables();
    const result = await query(
      `UPDATE providers
       SET name = $1,
           contact_name = $2,
           email = $3,
           phone = $4,
           website = $5,
           notes = $6,
           updated_at = NOW()
       WHERE id = $7
       RETURNING id, name, contact_name, email, phone, website, notes`,
      [
        parsed.data.name,
        parsed.data.contactName ?? null,
        parsed.data.email ?? null,
        parsed.data.phone ?? null,
        parsed.data.website ?? null,
        parsed.data.notes ?? null,
        req.params.providerId,
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Proveedor no encontrado" });
    }
    res.json(mapProviderRow(result.rows[0]));
  } catch (error) {
    res.status(500).json({ error: "Error actualizando proveedor" });
  }
});

catalogRouter.delete("/providers/:providerId", async (req, res) => {
  try {
    await ensureCatalogTables();
    const marginCheck = await query(
      "SELECT 1 FROM category_provider_margins WHERE provider_id = $1 LIMIT 1",
      [req.params.providerId]
    );
    if (marginCheck.rows.length > 0) {
      return res.status(400).json({ error: "El proveedor tiene márgenes asociados" });
    }
    const productCheck = await query(
      "SELECT 1 FROM products WHERE distributor_id = $1 LIMIT 1",
      [req.params.providerId]
    );
    if (productCheck.rows.length > 0) {
      return res.status(400).json({ error: "El proveedor está asignado a productos" });
    }
    const result = await query("DELETE FROM providers WHERE id = $1", [req.params.providerId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Proveedor no encontrado" });
    }
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando proveedor" });
  }
});

// Manufacturers
/**
 * @openapi
 * /api/catalog/manufacturers:
 *   get:
 *     tags:
 *       - Catalog
 *     summary: Lista fabricantes
 *     responses:
 *       200:
 *         description: Lista de fabricantes
 */
catalogRouter.get("/manufacturers", async (req, res) => {
  try {
    await ensureCatalogTables();
    const result = await query(
      "SELECT id, name, contact_name, email, phone, website, notes FROM manufacturers ORDER BY created_at DESC"
    );
    res.json({ items: result.rows.map(mapManufacturerRow) });
  } catch (error) {
    res.status(500).json({ error: "Error listando fabricantes" });
  }
});

/**
 * @openapi
 * /api/catalog/manufacturers:
 *   post:
 *     tags:
 *       - Catalog
 *     summary: Crea un fabricante
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               contactName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               website:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Fabricante creado
 */
catalogRouter.post("/manufacturers", async (req, res) => {
  const parsed = manufacturerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.format() });
  }
  const id = randomUUID();
  const { name, contactName, email, phone, website, notes } = parsed.data;
  try {
    await ensureCatalogTables();
    const existing = await query("SELECT id FROM manufacturers WHERE name = $1", [name]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Fabricante ya existe" });
    }
    const result = await query(
      `INSERT INTO manufacturers (id, name, contact_name, email, phone, website, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, contact_name, email, phone, website, notes`,
      [id, name, contactName ?? null, email ?? null, phone ?? null, website ?? null, notes ?? null]
    );
    res.status(201).json(mapManufacturerRow(result.rows[0]));
  } catch (error) {
    res.status(500).json({ error: "Error creando fabricante" });
  }
});

/**
 * @openapi
 * /api/catalog/manufacturers/{manufacturerId}:
 *   put:
 *     tags:
 *       - Catalog
 *     summary: Actualiza un fabricante
 *     parameters:
 *       - in: path
 *         name: manufacturerId
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
 *               contactName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               website:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Fabricante actualizado
 */
catalogRouter.put("/manufacturers/:manufacturerId", async (req, res) => {
  const parsed = manufacturerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.format() });
  }
  const { name, contactName, email, phone, website, notes } = parsed.data;
  try {
    await ensureCatalogTables();
    const result = await query(
      `UPDATE manufacturers
       SET name = $1,
           contact_name = $2,
           email = $3,
           phone = $4,
           website = $5,
           notes = $6,
           updated_at = NOW()
       WHERE id = $7
       RETURNING id, name, contact_name, email, phone, website, notes`,
      [name, contactName ?? null, email ?? null, phone ?? null, website ?? null, notes ?? null, req.params.manufacturerId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Fabricante no encontrado" });
    }
    res.json(mapManufacturerRow(result.rows[0]));
  } catch (error) {
    res.status(500).json({ error: "Error actualizando fabricante" });
  }
});

/**
 * @openapi
 * /api/catalog/manufacturers/{manufacturerId}:
 *   delete:
 *     tags:
 *       - Catalog
 *     summary: Elimina un fabricante
 *     parameters:
 *       - in: path
 *         name: manufacturerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Eliminado
 */
catalogRouter.delete("/manufacturers/:manufacturerId", async (req, res) => {
  try {
    await ensureCatalogTables();
    const result = await query("DELETE FROM manufacturers WHERE id = $1", [req.params.manufacturerId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Fabricante no encontrado" });
    }
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando fabricante" });
  }
});

// Margins by category/provider
catalogRouter.get("/margins", async (req, res) => {
  try {
    await ensureCatalogTables();
    const result = await query(
      `SELECT m.id, m.margin_percent, c.id AS category_id, c.name AS category_name,
              p.id AS provider_id, p.name AS provider_name
       FROM category_provider_margins m
       JOIN categories c ON c.id = m.category_id
       JOIN providers p ON p.id = m.provider_id
       ORDER BY p.name, c.name`
    );
    res.json({
      items: result.rows.map((row) => ({
        id: row.id,
        marginPercent: Number(row.margin_percent) || 0,
        categoryId: row.category_id,
        categoryName: row.category_name,
        providerId: row.provider_id,
        providerName: row.provider_name,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: "Error listando márgenes" });
  }
});

catalogRouter.post("/margins", async (req, res) => {
  const parsed = marginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.format() });
  }
  const id = randomUUID();
  const { providerId, categoryId, marginPercent } = parsed.data;
  try {
    await ensureCatalogTables();
    const providerCheck = await query("SELECT id FROM providers WHERE id = $1", [providerId]);
    if (providerCheck.rows.length === 0) {
      return res.status(400).json({ error: "Proveedor no encontrado" });
    }
    const categoryCheck = await query("SELECT id FROM categories WHERE id = $1", [categoryId]);
    if (categoryCheck.rows.length === 0) {
      return res.status(400).json({ error: "Categoría no encontrada" });
    }
    const result = await query(
      `INSERT INTO category_provider_margins (id, provider_id, category_id, margin_percent)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (category_id, provider_id)
       DO UPDATE SET margin_percent = EXCLUDED.margin_percent, updated_at = NOW()
       RETURNING id, provider_id, category_id, margin_percent`,
      [id, providerId, categoryId, marginPercent]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error guardando margen" });
  }
});

catalogRouter.delete("/margins/:marginId", async (req, res) => {
  try {
    const result = await query("DELETE FROM category_provider_margins WHERE id = $1", [req.params.marginId]);
    if (result.rowCount === 0) return res.status(404).json({ error: "Margen no encontrado" });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando margen" });
  }
});

// Price templates
catalogRouter.get("/templates", async (req, res) => {
  try {
    const result = await query("SELECT id, name, description FROM price_templates ORDER BY created_at DESC");
    res.json({ items: result.rows.map(mapTemplateRow) });
  } catch (error) {
    res.status(500).json({ error: "Error listando plantillas" });
  }
});

catalogRouter.post("/templates", async (req, res) => {
  const parsed = templateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.format() });
  }
  const id = randomUUID();
  try {
    const result = await query(
      `INSERT INTO price_templates (id, name, description)
       VALUES ($1, $2, $3)
       RETURNING id, name, description`,
      [id, parsed.data.name, parsed.data.description ?? null]
    );
    res.status(201).json(mapTemplateRow(result.rows[0]));
  } catch (error) {
    res.status(500).json({ error: "Error creando plantilla" });
  }
});

catalogRouter.get("/templates/:templateId/margins", async (req, res) => {
  try {
    const result = await query(
      `SELECT m.id, m.margin_percent, c.id AS category_id, c.name AS category_name
       FROM template_category_margins m
       JOIN categories c ON c.id = m.category_id
       WHERE m.template_id = $1
       ORDER BY c.name`,
      [req.params.templateId]
    );
    res.json({
      items: result.rows.map((row) => ({
        id: row.id,
        marginPercent: Number(row.margin_percent) || 0,
        categoryId: row.category_id,
        categoryName: row.category_name,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: "Error listando márgenes de plantilla" });
  }
});

catalogRouter.post("/templates/:templateId/margins", async (req, res) => {
  const parsed = templateMarginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.format() });
  }
  const id = randomUUID();
  const { categoryId, marginPercent } = parsed.data;
  try {
    const result = await query(
      `INSERT INTO template_category_margins (id, template_id, category_id, margin_percent)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (template_id, category_id)
       DO UPDATE SET margin_percent = EXCLUDED.margin_percent, updated_at = NOW()
       RETURNING id, template_id, category_id, margin_percent`,
      [id, req.params.templateId, categoryId, marginPercent]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error guardando margen de plantilla" });
  }
});

catalogRouter.delete("/templates/:templateId/margins/:marginId", async (req, res) => {
  try {
    const result = await query(
      "DELETE FROM template_category_margins WHERE id = $1 AND template_id = $2",
      [req.params.marginId, req.params.templateId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Margen no encontrado" });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando margen de plantilla" });
  }
});
