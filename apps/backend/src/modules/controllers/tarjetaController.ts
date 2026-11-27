import type { Request, Response } from "express";
import { parsePagination } from "../../utils/pagination.js";
import * as tarjetaService from "../services/tarjetaService.js";

function responderError(res: Response, error: any): void {
  const status = error.status || 500;
  const mensaje = error.message || "Error interno del servidor";
  res.status(status).json({ mensaje });
}

function parsearId(req: Request, res: Response): number | null {
  const idTarjeta = Number(req.params.id);
  if (!Number.isInteger(idTarjeta) || idTarjeta <= 0) {
    res.status(400).json({ mensaje: "El ID de la tarjeta debe ser un número válido." });
    return null;
  }
  return idTarjeta;
}

function parsearFiltros(req: Request): tarjetaService.FiltrosTarjeta {
  const filtros: tarjetaService.FiltrosTarjeta = {};

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

  if (req.query.tipo !== undefined) {
    const tipo = String(req.query.tipo);
    if (!["visa", "mastercard", "amex", "otra"].includes(tipo)) {
      const err: any = new Error("tipo debe ser visa, mastercard, amex u otra.");
      err.status = 400;
      throw err;
    }
    filtros.tipo = tipo as tarjetaService.FiltrosTarjeta["tipo"];
  }

  return filtros;
}

function scopeUsuario(req: Request): number | undefined {
  return req.usuario!.rol === "admin" ? undefined : req.usuario!.id;
}

// GET /api/v1/tarjetas -> Listado paginado con búsqueda y filtros
export async function listarTarjetas(req: Request, res: Response): Promise<void> {
  try {
    const paginacion = parsePagination(
      req.query,
      tarjetaService.CAMPOS_ORDEN_TARJETA,
      "id",
    );
    const filtros = parsearFiltros(req);
    const idUsuario = scopeUsuario(req);
    // Un usuario normal solo ve sus propias tarjetas.
    if (idUsuario !== undefined) filtros.idUsuario = idUsuario;
    const resultado = await tarjetaService.listarTarjetas(paginacion, filtros);
    res.status(200).json(resultado);
  } catch (error: any) {
    responderError(res, error);
  }
}

// POST /api/v1/tarjetas
export async function crearTarjeta(req: Request, res: Response): Promise<void> {
  try {
    // El propietario sale del token. Un admin puede crear para otro usuario.
    const idUsuario =
      req.usuario!.rol === "admin" && req.body?.idUsuario
        ? req.body.idUsuario
        : req.usuario!.id;
    const nueva = await tarjetaService.crearTarjeta({ ...req.body, idUsuario });
    res.status(201).json(nueva);
  } catch (error: any) {
    responderError(res, error);
  }
}

// GET /api/v1/tarjetas/:id
export async function obtenerTarjetaPorId(req: Request, res: Response): Promise<void> {
  try {
    const idTarjeta = parsearId(req, res);
    if (idTarjeta === null) return;

    const tarjeta = await tarjetaService.obtenerTarjetaPorId(idTarjeta, scopeUsuario(req));
    res.status(200).json(tarjeta);
  } catch (error: any) {
    responderError(res, error);
  }
}

// PUT/PATCH /api/v1/tarjetas/:id
export async function editarTarjeta(req: Request, res: Response): Promise<void> {
  try {
    const idTarjeta = parsearId(req, res);
    if (idTarjeta === null) return;

    const tarjeta = await tarjetaService.editarTarjeta(idTarjeta, req.body ?? {}, scopeUsuario(req));
    res.status(200).json(tarjeta);
  } catch (error: any) {
    responderError(res, error);
  }
}

// DELETE /api/v1/tarjetas/:id
export async function eliminarTarjeta(req: Request, res: Response): Promise<void> {
  try {
    const idTarjeta = parsearId(req, res);
    if (idTarjeta === null) return;

    const tarjeta = await tarjetaService.eliminarTarjeta(idTarjeta, scopeUsuario(req));
    res.status(200).json({
      mensaje: "Tarjeta eliminada correctamente.",
      data: tarjeta,
    });
  } catch (error: any) {
    responderError(res, error);
  }
}
