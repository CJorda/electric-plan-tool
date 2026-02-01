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

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(cors(corsOptions));
app.use(rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.max,
  standardHeaders: true,
  legacyHeaders: false,
}));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
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

initDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`API escuchando en puerto ${port}`);
    });
  })
  .catch((error) => {
    console.error("Error inicializando base de datos:", error);
    process.exit(1);
  });
