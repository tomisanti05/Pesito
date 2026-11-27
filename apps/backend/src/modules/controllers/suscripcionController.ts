import { Request, Response } from "express";
import * as suscripcionService from "../services/suscripcionService.js";
import { parsePagination } from "../../utils/pagination.js";

function responderError(res: Response, error: any): void {
  const status = error.status || 500;
  const mensaje = error.message || "Error interno del servidor";
  res.status(status).json({ mensaje });
}

function parsearId(req: Request, res: Response): number | null {
  const idSuscripcion = Number(req.params.id);
  if (!Number.isInteger(idSuscripcion) || idSuscripcion <= 0) {
    res.status(400).json({ mensaje: "El ID de la suscripción debe ser un número válido." });
    return null;
  }
  return idSuscripcion;
}

function parsearFiltros(req: Request): suscripcionService.FiltrosSuscripcion {
  const filtros: suscripcionService.FiltrosSuscripcion = {};

  if (req.query.idUsuario !== undefined) {
    const idUsuario = Number(req.query.idUsuario);
    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      const err: any = new Error("idUsuario debe ser un entero positivo.");
      err.status = 400;
      throw err;
    }
    filtros.idUsuario = idUsuario;
  }

  if (req.query.activa !== undefined) {
    const valor = String(req.query.activa).toLowerCase();
    if (valor !== "true" && valor !== "false") {
      const err: any = new Error("activa debe ser true o false.");
      err.status = 400;
      throw err;
    }
    filtros.activa = valor === "true";
  }

  return filtros;
}

function scopeUsuario(req: Request): number | undefined {
  return req.usuario!.rol === "admin" ? undefined : req.usuario!.id;
}

// GET /api/v1/suscripciones -> Listado paginado con búsqueda y orden
export async function listarSuscripciones(req: Request, res: Response): Promise<void> {
  try {
    const paginacion = parsePagination(
      req.query,
      suscripcionService.CAMPOS_ORDEN_SUSCRIPCION,
      "idSuscripcion",
    );
    const filtros = parsearFiltros(req);
    const idUsuario = scopeUsuario(req);
    // Un usuario normal solo ve sus propias suscripciones.
    if (idUsuario !== undefined) filtros.idUsuario = idUsuario;
    const resultado = await suscripcionService.listarSuscripciones(paginacion, filtros);
    res.status(200).json(resultado);
  } catch (error: any) {
    responderError(res, error);
  }
}

// POST /api/v1/suscripciones
export async function crearSuscripcion(req: Request, res: Response): Promise<void> {
  try {
    // El propietario sale del token. Un admin puede crear para otro usuario.
    const idUsuario =
      req.usuario!.rol === "admin" && req.body?.idUsuario
        ? req.body.idUsuario
        : req.usuario!.id;
    const nueva = await suscripcionService.crearSuscripcion({
      ...req.body,
      idUsuario,
    });
    res.status(201).json(nueva);
  } catch (error: any) {
    responderError(res, error);
  }
}

// GET /api/v1/suscripciones/:id
export async function obtenerSuscripcionPorId(req: Request, res: Response): Promise<void> {
  try {
    const idSuscripcion = parsearId(req, res);
    if (idSuscripcion === null) return;

    const suscripcion = await suscripcionService.obtenerSuscripcionPorId(idSuscripcion, scopeUsuario(req));
    res.status(200).json(suscripcion);
  } catch (error: any) {
    responderError(res, error);
  }
}

// PUT/PATCH /api/v1/suscripciones/:id
export async function editarSuscripcion(req: Request, res: Response): Promise<void> {
  try {
    const idSuscripcion = parsearId(req, res);
    if (idSuscripcion === null) return;

    const actualizada = await suscripcionService.editarSuscripcion(
      idSuscripcion,
      req.body,
      scopeUsuario(req),
    );
    res.status(200).json(actualizada);
  } catch (error: any) {
    responderError(res, error);
  }
}

// DELETE /api/v1/suscripciones/:id
export async function eliminarSuscripcion(req: Request, res: Response): Promise<void> {
  try {
    const idSuscripcion = parsearId(req, res);
    if (idSuscripcion === null) return;

    const eliminada = await suscripcionService.eliminarSuscripcion(idSuscripcion, scopeUsuario(req));
    res.status(200).json({
      mensaje: "Suscripción eliminada correctamente.",
      data: eliminada,
    });
  } catch (error: any) {
    responderError(res, error);
  }
}
