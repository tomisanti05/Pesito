import { Transaction } from '../models/transaction.js';
import { aplicarMovimiento } from './billeteraService.js';
import sequelize from '../../config/database.js';

interface RegistrarTransaccionDTO {
  idBilletera: number;
  monto: string;
  tipo: 'ingreso' | 'egreso';
  categoria: string;
  fecha: string;
  descripcion?: string;
}

function errorHttp(mensaje: string, status: number): Error {
  const err: any = new Error(mensaje);
  err.status = status;
  return err;
}

function validarMonto(monto: string) {
  const montoNum = Number(monto);
  if (!monto || isNaN(montoNum) || montoNum <= 0) {
    throw errorHttp('El monto debe ser un numero positivo', 400);
  }
  if (!/^\d+(\.\d{1,2})?$/.test(monto)) {
    throw errorHttp('El monto solo admite hasta dos decimales', 400);
  }
}

function validarTipo(tipo: string) {
  if (tipo !== 'ingreso' && tipo !== 'egreso') {
    throw errorHttp('El tipo debe ser ingreso o egreso', 400);
  }
}

function validarFecha(fecha: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw errorHttp('La fecha debe tener formato YYYY-MM-DD', 400);
  }
}

function validarCategoria(categoria: string) {
  if (!categoria || categoria.length > 100) {
    throw errorHttp('Categoria invalida', 400);
  }
}

function validarDatosMovimiento(dto: RegistrarTransaccionDTO) {
  if (!dto.idBilletera || !Number.isInteger(dto.idBilletera)) {
    throw errorHttp('idBilletera invalido', 400);
  }

  validarMonto(dto.monto);
  validarTipo(dto.tipo);
  validarFecha(dto.fecha);
  validarCategoria(dto.categoria);

  if (dto.descripcion && dto.descripcion.length > 255) {
    throw errorHttp('La descripcion es demasiado larga', 400);
  }
}

export async function registerTransaction(dto: RegistrarTransaccionDTO) {
  validarDatosMovimiento(dto);

  return await sequelize.transaction(async (t) => {
    await aplicarMovimiento(dto.idBilletera, dto.tipo, dto.monto, t);

    const transaccion = await Transaction.create(
      {
        idBilletera: dto.idBilletera,
        monto: dto.monto,
        tipo: dto.tipo,
        categoria: dto.categoria,
        fecha: dto.fecha,
        descripcion: dto.descripcion,
      },
      { transaction: t }
    );

    return transaccion;
  });
}

export async function listTransactions(filtro?: { idBilletera?: number }) {
  const where = filtro?.idBilletera ? { idBilletera: filtro.idBilletera } : {};
  return await Transaction.findAll({ where, order: [['fecha', 'DESC']] });
}

export async function getTransaction(id: number) {
  const transaccion = await Transaction.findByPk(id);
  if (!transaccion) {
    throw errorHttp('Movimiento no encontrado', 404);
  }
  return transaccion;
}