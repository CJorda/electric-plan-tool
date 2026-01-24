import { Router } from "express";

export const authRouter = Router();

authRouter.post("/register", (req, res) => {
  res.status(501).json({ error: "Registro pendiente de implementación" });
});

authRouter.post("/login", (req, res) => {
  res.status(501).json({ error: "Login pendiente de implementación" });
});

authRouter.post("/refresh", (req, res) => {
  res.status(501).json({ error: "Refresh pendiente de implementación" });
});

authRouter.post("/logout", (req, res) => {
  res.json({ ok: true });
});
