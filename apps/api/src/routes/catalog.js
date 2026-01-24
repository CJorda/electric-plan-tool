import { Router } from "express";

export const catalogRouter = Router();

catalogRouter.get("/categories", (req, res) => {
  res.status(501).json({ error: "Categorías pendientes" });
});

catalogRouter.get("/products", (req, res) => {
  res.status(501).json({ error: "Productos pendientes" });
});

catalogRouter.post("/products", (req, res) => {
  res.status(501).json({ error: "Crear producto pendiente" });
});

catalogRouter.get("/suppliers", (req, res) => {
  res.status(501).json({ error: "Proveedores pendientes" });
});
