import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import { authRouter } from "./routes/auth.js";
import { projectsRouter } from "./routes/projects.js";
import { catalogRouter } from "./routes/catalog.js";
import { reportsRouter } from "./routes/reports.js";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { initDatabase } from "./db.js";
import { env, rateLimitConfig } from "./config/env.js";
import { corsOptions, getSwaggerServerUrl } from "./config/cors.js";

const app = express();
const port = Number(env.PORT || 4001);
const host = env.API_HOST || "0.0.0.0";
let dbReady = false;
let keepAliveTimer = null;

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(cors(corsOptions));
const authLimiter = rateLimit({
  // Auth endpoints need a dedicated limiter so catalog traffic doesn't lock logins.
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: "Demasiadas solicitudes de autenticación. Intenta de nuevo en unos segundos." },
});

app.use(rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.max,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    req.path.startsWith("/api/auth/login") || req.path.startsWith("/api/auth/refresh"),
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/refresh", authLimiter);

app.get("/api/health", (req, res) => {
  res.status(dbReady ? 200 : 503).json({
    status: dbReady ? "ok" : "starting",
    dbReady,
    time: new Date().toISOString(),
  });
});

app.use((req, res, next) => {
  if (req.path === "/api/health") return next();
  if (!dbReady) {
    return res.status(503).json({ error: "API iniciando. Base de datos no disponible todavía." });
  }
  return next();
});

// Swagger / OpenAPI setup (mounted only outside production)
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Electric Plan Tool API",
      version: "1.0.0",
      description: "Documentación OpenAPI para la API del proyecto Electric Plan Tool",
    },
    servers: [{ url: getSwaggerServerUrl(`http://localhost:${env.PORT || 4001}`) }],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
if (process.env.NODE_ENV !== "production") {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/openapi.json", (req, res) => res.json(swaggerSpec));
}

app.use("/api/auth", authRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/catalog", catalogRouter);
app.use("/api/reports", reportsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.use((err, req, res, next) => {
  console.error("API error", err);
  res.status(500).json({ error: "Error interno del servidor" });
});

const server = app.listen(port, host, () => {
  console.log(`API escuchando en http://${host}:${port}`);
  // Keep process alive in shells that may terminate on idle.
  if (!keepAliveTimer) {
    keepAliveTimer = setInterval(() => {}, 60000);
  }
});

server.on("error", (error) => {
  console.error("Server error:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
});

initDatabase()
  .then(() => {
    dbReady = true;
    console.log("Base de datos inicializada correctamente");
  })
  .catch((error) => {
    dbReady = false;
    console.error("Error inicializando base de datos:", error);
  });
