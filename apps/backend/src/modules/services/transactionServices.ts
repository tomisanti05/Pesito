import { Decimal } from 'decimal.js';
import type { Transaction as SequelizeTransaction } from 'sequelize';
import { Transaction } from '../models/transaction.js';
import Billetera from '../models/billetera.js';
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

interface EditarTransaccionDTO {
  idBilletera?: number;
  monto?: string;
  tipo?: 'ingreso' | 'egreso';
  categoria?: string;
  fecha?: string;
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

function efectoFirmado(tipo: string, monto: string): Decimal {
  const valor = new Decimal(monto);
  return tipo === 'ingreso' ? valor : valor.negated();
}

// Verifica que la billetera pertenezca al usuario (si se pasó idUsuario).
async function verificarPropietario(idBilletera: number, idUsuario?: number, t?: SequelizeTransaction) {
  if (idUsuario === undefined) return;
  const billetera = await Billetera.findOne({
    where: { idBilletera, idUsuario },
    transaction: t,
  });
  if (!billetera) {
    throw errorHttp('Movimiento no encontrado', 404);
  }
}

export async function registerTransaction(dto: RegistrarTransaccionDTO, idUsuario?: number) {
  validarDatosMovimiento(dto);

  return await sequelize.transaction(async (t) => {
    await verificarPropietario(dto.idBilletera, idUsuario, t);
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

export async function listTransactions(filtro?: { idBilletera?: number }, idUsuario?: number) {
  const where: Record<string, unknown> = {};
  if (filtro?.idBilletera) {
    where.idBilletera = filtro.idBilletera;
  } else if (idUsuario !== undefined) {
    // Sin filtro explícito, solo las transacciones de las billeteras propias.
    const billeteras = await Billetera.findAll({
      where: { idUsuario },
      attributes: ['idBilletera'],
    });
    where.idBilletera = billeteras.map((b) => b.idBilletera);
  }
  return await Transaction.findAll({ where, order: [['fecha', 'DESC']] });
}

export async function getTransaction(id: number, idUsuario?: number) {
  const transaccion = await Transaction.findByPk(id);
  if (!transaccion) {
    throw errorHttp('Movimiento no encontrado', 404);
  }
  await verificarPropietario(transaccion.idBilletera, idUsuario);
  return transaccion;
}

export async function editTransaction(id: number, dto: EditarTransaccionDTO, idUsuario?: number) {
  if (dto.idBilletera !== undefined) {
    throw errorHttp('No se permite cambiar la billetera de una transaccion', 400);
  }

  return await sequelize.transaction(async (t) => {
    const transaccion = await Transaction.findByPk(id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!transaccion) {
      throw errorHttp('Movimiento no encontrado', 404);
    }
    await verificarPropietario(transaccion.idBilletera, idUsuario, t);

    const datos = {
      idBilletera: transaccion.idBilletera,
      monto: dto.monto !== undefined ? String(dto.monto) : transaccion.monto,
      tipo: dto.tipo ?? transaccion.tipo,
      categoria: dto.categoria ?? transaccion.categoria,
      fecha: dto.fecha ?? transaccion.fecha,
      descripcion: dto.descripcion !== undefined ? dto.descripcion : transaccion.descripcion,
    };
    validarDatosMovimiento(datos);

    const diferencia = efectoFirmado(datos.tipo, datos.monto).minus(
      efectoFirmado(transaccion.tipo, transaccion.monto)
    );

    if (diferencia.gt(0)) {
      await aplicarMovimiento(transaccion.idBilletera, 'ingreso', diferencia.toFixed(2), t);
    } else if (diferencia.lt(0)) {
      await aplicarMovimiento(transaccion.idBilletera, 'egreso', diferencia.abs().toFixed(2), t);
    }

    return await transaccion.update(datos, { transaction: t });
  });
}

export async function deleteTransaction(id: number, idUsuario?: number) {
  return await sequelize.transaction(async (t) => {
    const transaccion = await Transaction.findByPk(id, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!transaccion) {
      throw errorHttp('Movimiento no encontrado', 404);
    }
    await verificarPropietario(transaccion.idBilletera, idUsuario, t);

    const tipoInverso = transaccion.tipo === 'ingreso' ? 'egreso' : 'ingreso';
    await aplicarMovimiento(transaccion.idBilletera, tipoInverso, transaccion.monto, t);
    await transaccion.destroy({ transaction: t });

    return transaccion;
  });
}
