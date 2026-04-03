import {
  createHash,
  createPrivateKey,
  createPublicKey,
  sign as cryptoSign,
  verify as cryptoVerify,
} from "crypto";
import { env } from "../config/env.js";

const normalizePem = (value = "") => {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  return normalized.replace(/\\n/g, "\n");
};

const isValidSha256 = (value = "") => /^[a-f0-9]{64}$/i.test(String(value || "").trim());

const privateKeyPem = normalizePem(env.QUOTE_SIGNING_PRIVATE_KEY || "");
const publicKeyPem = normalizePem(env.QUOTE_SIGNING_PUBLIC_KEY || "");
const defaultAlgorithm = env.QUOTE_SIGNING_ALGORITHM || "RSA-SHA256";

let privateKey = null;
let publicKey = null;
let setupError = null;

if (privateKeyPem) {
  try {
    privateKey = createPrivateKey(privateKeyPem);
  } catch {
    setupError = "invalid_private_key";
  }
}

if (publicKeyPem) {
  try {
    publicKey = createPublicKey(publicKeyPem);
  } catch {
    setupError = setupError || "invalid_public_key";
  }
}

const keyId = publicKeyPem
  ? createHash("sha256").update(publicKeyPem).digest("hex").slice(0, 16)
  : null;

export const getQuoteSigningPublicInfo = () => ({
  enabled: Boolean(privateKey && publicKey),
  configured: Boolean(privateKeyPem || publicKeyPem),
  hasPublicKey: Boolean(publicKey),
  algorithm: defaultAlgorithm,
  keyId,
  publicKey: publicKeyPem || null,
  setupError,
});

export const signQuoteHash = (sha256) => {
  const hashValue = String(sha256 || "").trim().toLowerCase();

  if (!isValidSha256(hashValue)) {
    return { signed: false, reason: "invalid_sha256" };
  }

  if (!privateKey) {
    return { signed: false, reason: "private_key_not_configured" };
  }

  try {
    const signatureB64 = cryptoSign(
      defaultAlgorithm,
      Buffer.from(hashValue, "utf8"),
      privateKey
    ).toString("base64");

    return {
      signed: true,
      signatureB64,
      algorithm: defaultAlgorithm,
      keyId,
    };
  } catch {
    return { signed: false, reason: "sign_failed" };
  }
};

export const verifyQuoteHashSignature = ({
  sha256,
  signatureB64,
  algorithm,
  keyId: providedKeyId,
}) => {
  const hashValue = String(sha256 || "").trim().toLowerCase();

  if (!isValidSha256(hashValue)) {
    return { available: Boolean(publicKey), valid: false, reason: "invalid_sha256" };
  }

  if (!signatureB64) {
    return { available: Boolean(publicKey), valid: false, reason: "missing_signature" };
  }

  if (!publicKey) {
    return { available: false, valid: false, reason: "public_key_not_configured" };
  }

  if (providedKeyId && keyId && providedKeyId !== keyId) {
    return {
      available: true,
      valid: false,
      reason: "key_id_mismatch",
      algorithm: algorithm || defaultAlgorithm,
      keyId,
    };
  }

  try {
    const signatureBuffer = Buffer.from(String(signatureB64).trim(), "base64");
    const algorithmToUse = algorithm || defaultAlgorithm;
    const valid = cryptoVerify(
      algorithmToUse,
      Buffer.from(hashValue, "utf8"),
      publicKey,
      signatureBuffer
    );

    return {
      available: true,
      valid,
      reason: valid ? "ok" : "signature_mismatch",
      algorithm: algorithmToUse,
      keyId,
    };
  } catch {
    return {
      available: true,
      valid: false,
      reason: "verify_failed",
      algorithm: algorithm || defaultAlgorithm,
      keyId,
    };
  }
};
