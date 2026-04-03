import { corsOrigins, isProd } from "./env.js";

export const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (corsOrigins.length === 0) return callback(null, true);
    if (corsOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS not allowed"));
  },
  credentials: true,
  exposedHeaders: [
    "X-Quote-Sha256",
    "X-Quote-Signature",
    "X-Quote-Signature-Alg",
    "X-Quote-Signature-Key-Id",
  ],
  optionsSuccessStatus: 200,
};

export const getSwaggerServerUrl = (defaultUrl) => {
  if (!isProd) return defaultUrl;
  if (corsOrigins.length > 0) return corsOrigins[0];
  return defaultUrl;
};
