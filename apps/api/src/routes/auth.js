import { Router } from "express";
import crypto from "crypto";
import { z } from "zod";
import { query } from "../db.js";
import {
  decodeJwt,
  hashPassword,
  hashToken,
  issueAuthTokens,
  refreshCookieOptions,
  verifyPassword,
  verifyRefreshToken,
  refreshTtlMs,
} from "../lib/auth.js";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Registra un nuevo usuario (placeholder)
 *     responses:
 *       201:
 *         description: Usuario creado
 *       501:
 *         description: No implementado
 */
authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos" });
  }
  const { email, password, name } = parsed.data;
  const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: "Email ya registrado" });
  }
  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  await query(
    "INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)",
    [id, email, passwordHash, name || null]
  );
  const user = { id, email, name, role: "user" };
  const { accessToken, refreshToken } = issueAuthTokens(user);
  const refreshHash = hashToken(refreshToken);
  const decoded = decodeJwt(refreshToken);
  const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + refreshTtlMs);
  await query(
    "INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)",
    [crypto.randomUUID(), id, refreshHash, expiresAt]
  );
  res.cookie("refresh_token", refreshToken, refreshCookieOptions);
  return res.status(201).json({ user, accessToken });
});


/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Iniciar sesión (placeholder)
 *     responses:
 *       200:
 *         description: Token
 *       501:
 *         description: No implementado
 */
authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos" });
  }
  const { email, password } = parsed.data;
  const result = await query("SELECT id, email, password_hash, name, role FROM users WHERE email = $1", [email]);
  const user = result.rows[0];
  if (!user) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }
  const safeUser = { id: user.id, email: user.email, name: user.name, role: user.role };
  const { accessToken, refreshToken } = issueAuthTokens(safeUser);
  const refreshHash = hashToken(refreshToken);
  const decoded = decodeJwt(refreshToken);
  const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + refreshTtlMs);
  await query(
    "INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)",
    [crypto.randomUUID(), user.id, refreshHash, expiresAt]
  );
  res.cookie("refresh_token", refreshToken, refreshCookieOptions);
  return res.json({ user: safeUser, accessToken });
});


/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Refrescar token (placeholder)
 *     responses:
 *       200:
 *         description: Token renovado
 *       501:
 *         description: No implementado
 */
authRouter.post("/refresh", async (req, res) => {
  const token = req.cookies?.refresh_token || req.body?.refresh_token;
  if (!token) {
    return res.status(401).json({ error: "Refresh token requerido" });
  }
  try {
    const payload = verifyRefreshToken(token);
    const tokenHash = hashToken(token);
    const stored = await query(
      "SELECT id, user_id FROM refresh_tokens WHERE user_id = $1 AND token_hash = $2 AND revoked_at IS NULL",
      [payload.sub, tokenHash]
    );
    if (stored.rows.length === 0) {
      return res.status(401).json({ error: "Refresh token inválido" });
    }

    await query("UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1", [stored.rows[0].id]);
    const userResult = await query("SELECT id, email, name, role FROM users WHERE id = $1", [payload.sub]);
    const user = userResult.rows[0];
    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }
    const { accessToken, refreshToken } = issueAuthTokens(user);
    const refreshHash = hashToken(refreshToken);
    const decoded = decodeJwt(refreshToken);
    const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + refreshTtlMs);
    await query(
      "INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)",
      [crypto.randomUUID(), user.id, refreshHash, expiresAt]
    );
    res.cookie("refresh_token", refreshToken, refreshCookieOptions);
    return res.json({ user, accessToken });
  } catch {
    return res.status(401).json({ error: "Refresh token inválido" });
  }
});


/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Cerrar sesión
 *     responses:
 *       200:
 *         description: Sesión cerrada
 */
authRouter.post("/logout", async (req, res) => {
  const token = req.cookies?.refresh_token || req.body?.refresh_token;
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      const tokenHash = hashToken(token);
      await query(
        "UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND token_hash = $2",
        [payload.sub, tokenHash]
      );
    } catch {
      // ignore
    }
  }
  res.clearCookie("refresh_token", refreshCookieOptions);
  return res.json({ ok: true });
});
