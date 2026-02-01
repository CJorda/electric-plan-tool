import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

export const reportsRouter = Router();

reportsRouter.use(requireAuth);

reportsRouter.get("/materials/:projectId", (req, res) => {
  res.status(501).json({ error: "Reporte PDF pendiente" });
});
