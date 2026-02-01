require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const email = 'admin@admin.com';
const password = 'admin';
const name = 'Admin';

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'root',
  database: process.env.PGDATABASE || 'electric_plan_tool',
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

(async () => {
  await pool.query(
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

  await pool.query(
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

  const hash = await bcrypt.hash(password, 10);
  const id = crypto.randomUUID();
  await pool.query(
    'INSERT INTO users (id,email,password_hash,name,role) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash,name=EXCLUDED.name,role=EXCLUDED.role',
    [id, email, hash, name, 'admin']
  );

  await pool.end();
  console.log(`created ${email} ${password}`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
