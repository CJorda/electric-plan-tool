import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.string().default("4001"),
  API_HOST: z.string().default("0.0.0.0"),
  CORS_ORIGIN: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().default("dev_access_secret"),
  JWT_REFRESH_SECRET: z.string().default("dev_refresh_secret"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("7d"),
  DATABASE_URL: z.string().optional(),
  PGHOST: z.string().default("localhost"),
  PGPORT: z.string().default("5432"),
  PGUSER: z.string().default("postgres"),
  PGPASSWORD: z.string().default("root"),
  PGDATABASE: z.string().default("electric_plan_tool"),
  PGSSL: z.string().default("false"),
  PGCONNECT_TIMEOUT_MS: z.string().default("5000"),
  PGADMIN_DB: z.string().default("postgres"),
  RATE_LIMIT_WINDOW_MS: z.string().default("900000"),
  RATE_LIMIT_MAX: z.string().default("300"),
  QUOTE_SIGNING_PRIVATE_KEY: z.string().optional(),
  QUOTE_SIGNING_PUBLIC_KEY: z.string().optional(),
  QUOTE_SIGNING_ALGORITHM: z.string().default("RSA-SHA256"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
export const corsOrigins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(",").map((value) => value.trim()).filter(Boolean)
  : [];

export const rateLimitConfig = {
  windowMs: Number(env.RATE_LIMIT_WINDOW_MS || 900000),
  max: Number(env.RATE_LIMIT_MAX || 300),
};
