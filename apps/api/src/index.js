import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { authRouter } from "./routes/auth.js";
import { projectsRouter } from "./routes/projects.js";
import { catalogRouter } from "./routes/catalog.js";
import { reportsRouter } from "./routes/reports.js";
import { initDatabase } from "./db.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/api/auth", authRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/catalog", catalogRouter);
app.use("/api/reports", reportsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
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
