import { Router } from "express";

export const reportsRouter = Router();

reportsRouter.get("/materials/:projectId", (req, res) => {
  res.status(501).json({ error: "Reporte PDF pendiente" });
});
