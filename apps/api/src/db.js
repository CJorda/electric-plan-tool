import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = (text, params) => pool.query(text, params);

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
};
