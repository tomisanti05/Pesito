import type { Request, Response } from "express";
import {
  crearUsuario,
  HttpError,
  listarUsuarios,
  obtenerUsuario,
} from "../services/userServices.js";

function manejarError(res: Response, error: unknown): void {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ mensaje: error.message });
    return;
  }

  console.error("[users] error inesperado:", error);
  res.status(500).json({ mensaje: "Error interno del servidor." });
}

export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const usuario = await crearUsuario(req.body ?? {});
    res.status(201).json(usuario);
  } catch (error) {
    manejarError(res, error);
  }
}

export async function getUsers(_req: Request, res: Response): Promise<void> {
  try {
    const usuarios = await listarUsuarios();
    res.status(200).json(usuarios);
  } catch (error) {
    manejarError(res, error);
  }
}

export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    const usuario = await obtenerUsuario(req.params.id);
    res.status(200).json(usuario);
  } catch (error) {
    manejarError(res, error);
  }
}
