import { Request, Response } from "express";
import * as boletaService from "../services/boletaService.js";

function responderError(res: Response, error: any): void {
  const status = error.status || 500;
  const mensaje = error.message || "Error interno del servidor";
  res.status(status).json({ mensaje });
}

function scopeUsuario(req: Request): number | undefined {
  return req.usuario!.rol === "admin" ? undefined : req.usuario!.id;
}

export async function listarBoletas(req: Request, res: Response): Promise<void> {
  try {
    const boletas = await boletaService.listarBoletas(scopeUsuario(req));
    res.status(200).json(boletas);
  } catch (error: any) {
    responderError(res, error);
  }
}

export async function crearBoleta(req: Request, res: Response): Promise<void> {
  try {
    // El propietario sale del token, no del body.
    const boleta = await boletaService.crearBoleta(req.body, req.usuario!.id);
    res.status(201).json(boleta);
  } catch (error: any) {
    responderError(res, error);
  }
}

export async function obtenerBoleta(req: Request, res: Response): Promise<void> {
  try {
    const boleta = await boletaService.obtenerBoleta(Number(req.params.id), scopeUsuario(req));
    res.status(200).json(boleta);
  } catch (error: any) {
    responderError(res, error);
  }
}

export async function editarBoleta(req: Request, res: Response): Promise<void> {
  try {
    const boleta = await boletaService.editarBoleta(Number(req.params.id), req.body, scopeUsuario(req));
    res.status(200).json(boleta);
  } catch (error: any) {
    responderError(res, error);
  }
}

export async function eliminarBoleta(req: Request, res: Response): Promise<void> {
  try {
    const boleta = await boletaService.eliminarBoleta(Number(req.params.id), scopeUsuario(req));
    res.status(200).json(boleta);
  } catch (error: any) {
    responderError(res, error);
  }
}
