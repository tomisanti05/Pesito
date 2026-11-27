import type { Request, Response } from "express";
import { parsePagination } from "../../utils/pagination.js";
import {
  CAMPOS_ORDEN_USUARIO,
  crearUsuario,
  editarUsuario,
  eliminarUsuario,
  HttpError,
  listarUsuarios,
  obtenerUsuario,
  type FiltrosUsuario,
} from "../services/userServices.js";

function manejarError(res: Response, error: unknown): void {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ mensaje: error.message });
    return;
  }

  console.error("[users] error inesperado:", error);
  res.status(500).json({ mensaje: "Error interno del servidor." });
}

function parsearFiltros(req: Request): FiltrosUsuario {
  const filtros: FiltrosUsuario = {};

  if (req.query.rol !== undefined) {
    const rol = String(req.query.rol);
    if (rol !== "usuario" && rol !== "admin") {
      throw new HttpError(400, "El rol debe ser usuario o admin.");
    }
    filtros.rol = rol;
  }

  if (req.query.activo !== undefined) {
    const valor = String(req.query.activo).toLowerCase();
    if (valor !== "true" && valor !== "false") {
      throw new HttpError(400, "El campo activo debe ser true o false.");
    }
    filtros.activo = valor === "true";
  }

  return filtros;
}

// Un usuario solo puede ver/editar su propio registro; un admin, cualquiera.
function revisarPermisosSobreUsuario(req: Request): void {
  if (req.usuario!.rol === "admin") return;

  const idPedido = Number(req.params.id);
  if (req.usuario!.id !== idPedido) {
    throw new HttpError(403, "No tenés permisos para acceder a este usuario.");
  }
}

export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const usuario = await crearUsuario(req.body ?? {});
    res.status(201).json(usuario);
  } catch (error) {
    manejarError(res, error);
  }
}

export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const paginacion = parsePagination(req.query, CAMPOS_ORDEN_USUARIO, "id");
    const filtros = parsearFiltros(req);
    const usuarios = await listarUsuarios(paginacion, filtros);
    res.status(200).json(usuarios);
  } catch (error) {
    manejarError(res, error);
  }
}

export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    revisarPermisosSobreUsuario(req);
    const usuario = await obtenerUsuario(req.params.id);
    res.status(200).json(usuario);
  } catch (error) {
    manejarError(res, error);
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    revisarPermisosSobreUsuario(req);

    // Un usuario normal no puede cambiar su propio rol ni des/activar cuentas.
    const datos = { ...(req.body ?? {}) } as Record<string, unknown>;
    if (req.usuario!.rol !== "admin") {
      delete datos.rol;
      delete datos.activo;
    }

    const usuario = await editarUsuario(req.params.id, datos);
    res.status(200).json(usuario);
  } catch (error) {
    manejarError(res, error);
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    revisarPermisosSobreUsuario(req);
    const usuario = await eliminarUsuario(req.params.id);
    res.status(200).json({
      mensaje: "Usuario dado de baja correctamente.",
      data: usuario,
    });
  } catch (error) {
    manejarError(res, error);
  }
}
