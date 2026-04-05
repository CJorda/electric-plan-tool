import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { env, isProd } from "../config/env.js";

const parseDurationMs = (value, fallbackMs) => {
  if (!value) return fallbackMs;
  const match = /^([0-9]+)([smhd])$/i.exec(value.trim());
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return amount * (multipliers[unit] || 1000);
};

export const refreshTtlMs = parseDurationMs(env.JWT_REFRESH_TTL, 7 * 24 * 60 * 60 * 1000);

export const hashPassword = async (password) => bcrypt.hash(password, 10);
export const verifyPassword = async (password, hash) => bcrypt.compare(password, hash);

const signAccessToken = (user) =>
  jwt.sign(
    { sub: user.id, email: user.email, role: user.role || "user" },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_TTL }
  );

const signRefreshToken = (user) =>
  jwt.sign(
    { sub: user.id },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_TTL, jwtid: crypto.randomUUID() }
  );

export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax",
  path: "/api/auth/refresh",
  maxAge: refreshTtlMs,
};

export const issueAuthTokens = (user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  return { accessToken, refreshToken };
};

export const decodeJwt = (token) => {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET);

export const verifyAccessToken = (token) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET);
