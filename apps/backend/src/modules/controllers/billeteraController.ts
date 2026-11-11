import { Request, Response } from "express";
import * as billeteraService from "../services/billeteraService.js";
import { parsePagination } from "../../utils/pagination.js";

function responderError(res: Response, error: any): void {
    const status = error.status || 500;
    const mensaje = error.message || "Error interno del servidor";
    res.status(status).json({ mensaje });
}

function parsearId(req: Request, res: Response): number | null {
    const idBilletera = Number(req.params.id);
    if (!Number.isInteger(idBilletera) || idBilletera <= 0) {
        res.status(400).json({ mensaje: "El ID de la billetera debe ser un número válido." });
        return null;
    }
    return idBilletera;
}

// GET /api/v1/billeteras -> Listado paginado con búsqueda y orden
export async function listarBilleteras(req: Request, res: Response): Promise<void> {
    try {
        const paginacion = parsePagination(
            req.query,
            billeteraService.CAMPOS_ORDEN_BILLETERA,
            "idBilletera",
        );
        const resultado = await billeteraService.listarBilleteras(paginacion);
        res.status(200).json(resultado);
    } catch (error: any) {
        responderError(res, error);
    }
}

// POST /api/v1/billeteras -> Crear billetera con saldo 0.00
export async function crearBilletera(req: Request, res: Response): Promise<void> {
    try {
        const { idUsuario, nombre, tipo } = req.body;
        const nuevaBilletera = await billeteraService.CrearBilletera({ idUsuario, nombre, tipo });
        res.status(201).json(nuevaBilletera);
    } catch (error: any) {
        responderError(res, error);
    }
}

// GET /api/v1/billeteras/:id -> Detalle y saldo actual
export async function obtenerBilleteraPorId(req: Request, res: Response): Promise<void> {
    try {
        const idBilletera = parsearId(req, res);
        if (idBilletera === null) return;

        const billetera = await billeteraService.obtenerBilleteraPorId(idBilletera);
        res.status(200).json(billetera);
    } catch (error: any) {
        responderError(res, error);
    }
}

// PUT/PATCH /api/v1/billeteras/:id -> Editar únicamente nombre y tipo
export async function editarBilletera(req: Request, res: Response): Promise<void> {
    try {
        const idBilletera = parsearId(req, res);
        if (idBilletera === null) return;

        const billeteraActualizada = await billeteraService.editarBilletera(idBilletera, req.body);
        res.status(200).json(billeteraActualizada);
    } catch (error: any) {
        responderError(res, error);
    }
}

// DELETE /api/v1/billeteras/:id -> Eliminar billetera
export async function eliminarBilletera(req: Request, res: Response): Promise<void> {
    try {
        const idBilletera = parsearId(req, res);
        if (idBilletera === null) return;

        const billeteraEliminada = await billeteraService.eliminarBilletera(idBilletera);
        res.status(200).json({
            mensaje: "Billetera eliminada correctamente.",
            data: billeteraEliminada,
        });
    } catch (error: any) {
        responderError(res, error);
    }
}
