import { corsOrigins, isProd } from "./env.js";

export const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (corsOrigins.length === 0) return callback(null, true);
    if (corsOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS not allowed"));
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

export const getSwaggerServerUrl = (defaultUrl) => {
  if (!isProd) return defaultUrl;
  if (corsOrigins.length > 0) return corsOrigins[0];
  return defaultUrl;
};
