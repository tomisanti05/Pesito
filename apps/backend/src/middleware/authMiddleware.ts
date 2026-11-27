import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/httpError.js";
import { verificarToken } from "../utils/jwt.js";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res
      .status(401)
      .json({ mensaje: "Necesitás iniciar sesión para continuar." });
    return;
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    req.usuario = verificarToken(token);
    next();
  } catch (error) {
    if (error instanceof HttpError) {
      res.status(error.statusCode).json({ mensaje: error.message });
      return;
    }

    next(error);
  }
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.usuario?.rol !== "admin") {
    res
      .status(403)
      .json({ mensaje: "No tenés permisos para realizar esta acción." });
    return;
  }

  next();
}
