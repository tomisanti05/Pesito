import { Request, Response } from 'express';
import * as transactionService from '../services/transactionServices.js';

export async function crearTransaccion(req: Request, res: Response) {
  try {
    const transaccion = await transactionService.registerTransaction(req.body);
    return res.status(201).json(transaccion);
  } catch (error: any) {
    const status = error.status || 500;
    const mensaje = error.message || 'Error interno';
    return res.status(status).json({ error: mensaje });
  }
}

export async function listarTransacciones(req: Request, res: Response) {
  try {
    const idBilletera = req.query.idBilletera ? Number(req.query.idBilletera) : undefined;
    const filtro = idBilletera ? { idBilletera } : undefined;
    const transacciones = await transactionService.listTransactions(filtro);
    return res.status(200).json(transacciones);
  } catch (error: any) {
    return res.status(500).json({ error: 'Error interno' });
  }
}

export async function obtenerTransaccion(req: Request, res: Response) {
  try {
    const transaccion = await transactionService.getTransaction(Number(req.params.id));
    return res.status(200).json(transaccion);
  } catch (error: any) {
    const status = error.status || 500;
    return res.status(status).json({ error: error.message });
  }
}