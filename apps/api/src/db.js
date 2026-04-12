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
  await query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_id UUID");
  await query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS client TEXT");
  await query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS reference TEXT");
  await query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS address TEXT");
  await query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS design JSONB");
  await query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS versions JSONB");
  await query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ");
  await query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS accepted_by JSONB");
  await query(
    `DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'projects_client_id_fkey'
      ) THEN
        ALTER TABLE projects
          ADD CONSTRAINT projects_client_id_fkey
          FOREIGN KEY (client_id)
          REFERENCES clients(id)
          ON DELETE SET NULL;
      END IF;
    END
    $$;`
  );
  await query("CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id)");
  await query(
    `UPDATE projects p
     SET client_id = c.id
     FROM clients c
     WHERE p.client_id IS NULL
       AND p.client IS NOT NULL
       AND LOWER(p.client) = LOWER(c.name)`
  );
};

export const ensureProjectAttachmentsTable = async () => {
  await query(
    `CREATE TABLE IF NOT EXISTS project_attachments (
      id UUID PRIMARY KEY,
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      mime_type TEXT,
      size INTEGER NOT NULL DEFAULT 0,
      data BYTEA NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`
  );
};

export const ensureQuoteVerificationTable = async () => {
  await query(
    `CREATE TABLE IF NOT EXISTS quote_pdf_verifications (
      id UUID PRIMARY KEY,
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      pdf_sha256 TEXT NOT NULL,
      pdf_size INTEGER NOT NULL DEFAULT 0,
      issued_by TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      signature_b64 TEXT,
      signature_algorithm TEXT,
      signature_key_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(project_id, pdf_sha256)
    );`
  );
  await query("ALTER TABLE quote_pdf_verifications ADD COLUMN IF NOT EXISTS signature_b64 TEXT");
  await query("ALTER TABLE quote_pdf_verifications ADD COLUMN IF NOT EXISTS signature_algorithm TEXT");
  await query("ALTER TABLE quote_pdf_verifications ADD COLUMN IF NOT EXISTS signature_key_id TEXT");
  await query(
    `CREATE INDEX IF NOT EXISTS idx_quote_pdf_verifications_project_created
     ON quote_pdf_verifications(project_id, created_at DESC);`
  );
  await query(
    `CREATE INDEX IF NOT EXISTS idx_quote_pdf_verifications_sha256
     ON quote_pdf_verifications(pdf_sha256);`
  );
};

export const ensureClientsTable = async () => {
  await query(
    `CREATE TABLE IF NOT EXISTS clients (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      contact_name TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`
  );
  await query("ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_name TEXT");
  await query("ALTER TABLE clients ADD COLUMN IF NOT EXISTS email TEXT");
  await query("ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone TEXT");
  await query("ALTER TABLE clients ADD COLUMN IF NOT EXISTS address TEXT");
  await query("ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT");
  await query("CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name)");
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
      image_data BYTEA,
      image_mime TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`
  );
  await query("ALTER TABLE products ADD COLUMN IF NOT EXISTS manufacturer TEXT");
  await query("ALTER TABLE products ADD COLUMN IF NOT EXISTS distributor_id UUID");
  await query("ALTER TABLE products ADD COLUMN IF NOT EXISTS image_data BYTEA");
  await query("ALTER TABLE products ADD COLUMN IF NOT EXISTS image_mime TEXT");
  await query(
    `CREATE TABLE IF NOT EXISTS product_price_history (
      id UUID PRIMARY KEY,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      distributor_id UUID,
      distributor_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      discount_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      shipping_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'EUR',
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`
  );
  await query("ALTER TABLE product_price_history ADD COLUMN IF NOT EXISTS distributor_id UUID");
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
    `CREATE TABLE IF NOT EXISTS product_distributor_prices (
      id UUID PRIMARY KEY,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      distributor_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
      distributor_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      discount_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      shipping_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
      lead_time TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(product_id, distributor_id)
    );`
  );
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

export const ensureOperationsTables = async () => {
  await query(
    `CREATE TABLE IF NOT EXISTS inventory_items (
      id UUID PRIMARY KEY,
      sku TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT,
      unit TEXT,
      min_stock NUMERIC(12,2) NOT NULL DEFAULT 0,
      current_stock NUMERIC(12,2) NOT NULL DEFAULT 0,
      cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      sale_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      location TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`
  );

  await query(
    `CREATE TABLE IF NOT EXISTS purchase_orders (
      id UUID PRIMARY KEY,
      supplier TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'requested',
      expected_date DATE,
      total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'EUR',
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`
  );

  await query(
    `CREATE TABLE IF NOT EXISTS saved_reports (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      filters JSONB NOT NULL DEFAULT '{}'::jsonb,
      last_run_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`
  );

  await query(
    `CREATE TABLE IF NOT EXISTS approvals (
      id UUID PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      requested_by TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      approved_by TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`
  );

  await query(
    `CREATE TABLE IF NOT EXISTS planning_tasks (
      id UUID PRIMARY KEY,
      title TEXT NOT NULL,
      project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
      assignee TEXT,
      start_date DATE,
      due_date DATE,
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'todo',
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`
  );

  await query(
    `CREATE TABLE IF NOT EXISTS labor_rates (
      id UUID PRIMARY KEY,
      role TEXT NOT NULL,
      hourly_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
      overtime_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`
  );

  await query(
    `CREATE TABLE IF NOT EXISTS project_templates (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      default_type TEXT,
      default_status TEXT,
      template_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`
  );

  await query(
    `CREATE TABLE IF NOT EXISTS audit_events (
      id UUID PRIMARY KEY,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      actor TEXT,
      severity TEXT NOT NULL DEFAULT 'info',
      details JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`
  );

  await query(
    `CREATE TABLE IF NOT EXISTS integrations (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      provider TEXT,
      base_url TEXT,
      api_key_masked TEXT,
      status TEXT NOT NULL DEFAULT 'inactive',
      config JSONB NOT NULL DEFAULT '{}'::jsonb,
      last_sync_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`
  );

  await query(
    `CREATE TABLE IF NOT EXISTS advanced_settings (
      id UUID PRIMARY KEY,
      setting_key TEXT NOT NULL,
      setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
      scope TEXT NOT NULL DEFAULT 'global',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(setting_key, scope)
    );`
  );

  await query("CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status)");
  await query("CREATE INDEX IF NOT EXISTS idx_planning_tasks_project_id ON planning_tasks(project_id)");
  await query("CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events(created_at DESC)");
};

export const initDatabase = async () => {
  await ensureDatabase();
  await ensureClientsTable();
  await ensureProjectsTable();
  await ensureProjectAttachmentsTable();
  await ensureQuoteVerificationTable();
  await ensureCatalogTables();
  await ensureAuthTables();
  await ensureOperationsTables();
};
