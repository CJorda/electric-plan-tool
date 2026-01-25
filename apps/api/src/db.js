import pg from "pg";

const { Pool } = pg;

const parseDatabaseUrl = () => {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  const url = new URL(process.env.DATABASE_URL);
  const database = url.pathname?.replace(/^\//, "") || "electric_plan_tool";
  const sslMode = url.searchParams.get("sslmode");
  const ssl = sslMode === "require" ? { rejectUnauthorized: false } : undefined;
  return {
    host: url.hostname || "localhost",
    port: Number(url.port || 5432),
    user: decodeURIComponent(url.username || "postgres"),
    password: decodeURIComponent(url.password || ""),
    database,
    ssl,
  };
};

const envConfig = {
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "root",
  database: process.env.PGDATABASE || "electric_plan_tool",
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined,
};

const baseConfig = parseDatabaseUrl() ?? envConfig;
const pool = new Pool(baseConfig);

const quoteIdentifier = (value) => `"${String(value).replace(/"/g, '""')}"`;

export const query = (text, params) => pool.query(text, params);

export const ensureDatabase = async () => {
  const adminDb = process.env.PGADMIN_DB || "postgres";
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
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`
  );
  await query(
    `CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY,
      category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      name TEXT NOT NULL,
      serial TEXT,
      distributor_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      discount_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      shipping_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
      lead_time TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`
  );
};

export const initDatabase = async () => {
  await ensureDatabase();
  await ensureProjectsTable();
  await ensureCatalogTables();
};
