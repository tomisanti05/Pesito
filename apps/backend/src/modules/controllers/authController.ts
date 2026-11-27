import type { Request, Response } from "express";
import { HttpError } from "../../utils/httpError.js";
import {
  cambiarPassword,
  iniciarSesion,
  obtenerPerfil,
  registrarUsuario,
  restablecerPassword,
  solicitarRecuperacion,
} from "../services/authService.js";

function manejarError(res: Response, error: unknown): void {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ mensaje: error.message });
    return;
  }

  console.error("[auth] error inesperado:", error);
  res.status(500).json({ mensaje: "Error interno del servidor." });
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const resultado = await registrarUsuario(req.body ?? {});
    res.status(201).json(resultado);
  } catch (error) {
    manejarError(res, error);
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const resultado = await iniciarSesion(req.body ?? {});
    res.status(200).json(resultado);
  } catch (error) {
    manejarError(res, error);
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  try {
    const usuario = await obtenerPerfil(req.usuario!.id);
    res.status(200).json(usuario);
  } catch (error) {
    manejarError(res, error);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const host = req.get("host");
    const origen =
      req.get("origin") ?? (host ? `${req.protocol}://${host}` : undefined);
    const resultado = await solicitarRecuperacion(req.body?.email, origen);
    res.status(200).json(resultado);
  } catch (error) {
    manejarError(res, error);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const resultado = await restablecerPassword(req.body ?? {});
    res.status(200).json(resultado);
  } catch (error) {
    manejarError(res, error);
  }
}

export async function changePassword(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const resultado = await cambiarPassword(req.usuario!.id, req.body ?? {});
    res.status(200).json(resultado);
  } catch (error) {
    manejarError(res, error);
  }
}
