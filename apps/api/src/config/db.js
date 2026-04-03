import { env } from "./env.js";

const parseDatabaseUrl = () => {
  if (!env.DATABASE_URL) {
    return null;
  }
  const url = new URL(env.DATABASE_URL);
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
  host: env.PGHOST || "localhost",
  port: Number(env.PGPORT || 5432),
  user: env.PGUSER || "postgres",
  password: env.PGPASSWORD || "root",
  database: env.PGDATABASE || "electric_plan_tool",
  ssl: env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: Number(env.PGCONNECT_TIMEOUT_MS || 5000),
};

export const baseConfig = parseDatabaseUrl() ?? envConfig;
