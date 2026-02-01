import pg from "pg";
import { baseConfig } from "./config/db.js";
import { env } from "./config/env.js";

const { Pool } = pg;
const pool = new Pool(baseConfig);

const quoteIdentifier = (value) => `"${String(value).replace(/"/g, '""')}"`;

export const query = (text, params) => pool.query(text, params);

export const ensureDatabase = async () => {
  const adminDb = env.PGADMIN_DB || "postgres";
  const adminPool = new Pool({
    ...baseConfig,
    database: adminDb,
  });
  try {
    const existing = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [baseConfig.database]
    );
    if (existing.rows.length === 0) {
      await adminPool.query(`CREATE DATABASE ${quoteIdentifier(baseConfig.database)}`);
    }
  } finally {
    await adminPool.end();
  }
};

export const ensureProjectsTable = async () => {
  await query(
    `CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`
  );
  await query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS design JSONB");
};

export const ensureCatalogTables = async () => {
  await query(
    `CREATE TABLE IF NOT EXISTS categories (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      parent_id UUID,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`
  );
  await query("ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id UUID");
  await query(
    `DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'categories_parent_id_fkey'
      ) THEN
        ALTER TABLE categories
          ADD CONSTRAINT categories_parent_id_fkey
          FOREIGN KEY (parent_id)
          REFERENCES categories(id)
          ON DELETE SET NULL;
      END IF;
    END
    $$;`
  );
  await query(
    `CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY,
      category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      name TEXT NOT NULL,
      manufacturer TEXT,
      distributor_id UUID,
      serial TEXT,
      distributor_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      discount_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      shipping_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
      lead_time TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`
  );
  await query("ALTER TABLE products ADD COLUMN IF NOT EXISTS manufacturer TEXT");
  await query("ALTER TABLE products ADD COLUMN IF NOT EXISTS distributor_id UUID");
  await query(
    `CREATE TABLE IF NOT EXISTS product_price_history (
      id UUID PRIMARY KEY,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      distributor_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      discount_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      shipping_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'EUR',
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`
  );
  await query(
    `CREATE TABLE IF NOT EXISTS manufacturers (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      contact_name TEXT,
      email TEXT,
      phone TEXT,
      website TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`
  );
  await query(
    `CREATE TABLE IF NOT EXISTS providers (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      contact_name TEXT,
      email TEXT,
      phone TEXT,
      website TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`
  );
  await query("ALTER TABLE providers ADD COLUMN IF NOT EXISTS contact_name TEXT");
  await query("ALTER TABLE providers ADD COLUMN IF NOT EXISTS email TEXT");
  await query("ALTER TABLE providers ADD COLUMN IF NOT EXISTS phone TEXT");
  await query("ALTER TABLE providers ADD COLUMN IF NOT EXISTS website TEXT");
  await query("ALTER TABLE providers ADD COLUMN IF NOT EXISTS notes TEXT");
  await query(
    `DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'products_distributor_id_fkey'
      ) THEN
        ALTER TABLE products
          ADD CONSTRAINT products_distributor_id_fkey
          FOREIGN KEY (distributor_id)
          REFERENCES providers(id)
          ON DELETE SET NULL;
      END IF;
    END
    $$;`
  );
  await query(
    `CREATE TABLE IF NOT EXISTS category_provider_margins (
      id UUID PRIMARY KEY,
      category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
      margin_percent NUMERIC(6,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(category_id, provider_id)
    );`
  );
  await query(
    `CREATE TABLE IF NOT EXISTS price_templates (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`
  );
  await query(
    `CREATE TABLE IF NOT EXISTS template_category_margins (
      id UUID PRIMARY KEY,
      template_id UUID NOT NULL REFERENCES price_templates(id) ON DELETE CASCADE,
      category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      margin_percent NUMERIC(6,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(template_id, category_id)
    );`
  );
};

export const ensureAuthTables = async () => {
  await query(
    `CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`
  );
  await query(
    `CREATE TABLE IF NOT EXISTS refresh_tokens (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ,
      UNIQUE(user_id, token_hash)
    );`
  );
};

export const initDatabase = async () => {
  await ensureDatabase();
  await ensureProjectsTable();
  await ensureCatalogTables();
  await ensureAuthTables();
};
