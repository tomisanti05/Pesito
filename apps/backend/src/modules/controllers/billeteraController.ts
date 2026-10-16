import { Request,Response } from "express";
import * as billeteraService from "../services/billeteraService.js"

// POST /api/wallets -> Crear billetera con saldo 0.00
export async function crearBilletera(req: Request, res:Response): Promise<void> {
    try {
        const { idUsuario, nombre, tipo } = req.body;
        const nuevaBilletera = await billeteraService.CrearBilletera({ idUsuario, nombre, tipo });
        res.status(201).json(nuevaBilletera);
    } catch (error: any) {
        const status = error.status || 500;
        const message = error.message || "Error interno del servidor";
        res.status(status).json({ error: message });
    }
}
// GET /api/wallets/:id -> Detalle y saldo actual
export async function obtenerBilleteraPorId(req: Request, res: Response): Promise<void> {
    try {
        const idBilletera = Number(req.params.id);
        if (isNaN(idBilletera)) {
            res.status(400).json({ error: "El ID de la billetera debe ser un número válido." });
            return;
        }

        const billetera = await billeteraService.obtenerBilleteraPorId(idBilletera);
        res.status(200).json(billetera);
    } catch (error: any) {
        const status = error.status || 500;
        const message = error.message || "Error interno del servidor";
        res.status(status).json({ error: message });
    }
}
// PUT /api/wallets/:id -> Editar únicamente nombre y tipo
export async function editarBilletera(req: Request, res: Response): Promise<void> {
    try {
        const idBilletera = Number(req.params.id);
        if (isNaN(idBilletera)) {
            res.status(400).json({ error: "El ID de la billetera debe ser un número válido." });
            return;
        }

        const billeteraActualizada = await billeteraService.editarBilletera(idBilletera, req.body);
        res.status(200).json(billeteraActualizada);
    } catch (error: any) {
        const status = error.status || 500;
        const message = error.message || "Error interno del servidor";
        res.status(status).json({ error: message });
    }
}