import { Decimal } from "decimal.js";
import { Op, QueryTypes, type WhereOptions } from "sequelize";
import sequelize from "../../config/database.js";
import User from "../models/user.js";
import Suscripcion from "../models/suscripcion.js";
import type { PaginationParams } from "../../utils/pagination.js";

export const CAMPOS_ORDEN_SUSCRIPCION = [
  "idSuscripcion",
  "proveedor",
  "plan",
  "monto",
  "diaCobro",
  "activa",
  "createdAt",
  "updatedAt",
] as const;

export interface CrearSuscripcionDTO {
  idUsuario: unknown;
  idTarjeta?: unknown;
  proveedor: unknown;
  plan: unknown;
  monto: unknown;
  diaCobro: unknown;
  activa?: unknown;
}

export interface EditarSuscripcionDTO {
  idUsuario?: unknown;
  idTarjeta?: unknown;
  proveedor?: unknown;
  plan?: unknown;
  monto?: unknown;
  diaCobro?: unknown;
  activa?: unknown;
}

export interface FiltrosSuscripcion {
  idUsuario?: number;
  activa?: boolean;
}

function errorHttp(mensaje: string, status: number): Error {
  const err: any = new Error(mensaje);
  err.status = status;
  return err;
}

function validarId(valor: unknown, campo: string): number {
  const numero = typeof valor === "number" ? valor : Number(valor);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw errorHttp(`${campo} debe ser un entero positivo.`, 400);
  }
  return numero;
}

function validarTexto(valor: unknown, campo: string, max: number): string {
  if (typeof valor !== "string") {
    throw errorHttp(`${campo} es obligatorio.`, 400);
  }
  const limpio = valor.trim();
  if (limpio.length === 0) {
    throw errorHttp(`${campo} es obligatorio.`, 400);
  }
  if (limpio.length > max) {
    throw errorHttp(`${campo} no puede superar los ${max} caracteres.`, 400);
  }
  return limpio;
}

function validarMonto(valor: unknown): string {
  const texto = typeof valor === "string" ? valor.trim() : String(valor ?? "");
  if (!/^\d+(\.\d{1,2})?$/.test(texto)) {
    throw errorHttp("El monto debe ser un número positivo con hasta dos decimales.", 400);
  }
  const numero = new Decimal(texto);
  if (numero.lte(0)) {
    throw errorHttp("El monto debe ser mayor a cero.", 400);
  }
  return numero.toFixed(2);
}

function validarDiaCobro(valor: unknown): number {
  const numero = typeof valor === "number" ? valor : Number(valor);
  if (!Number.isInteger(numero) || numero < 1 || numero > 31) {
    throw errorHttp("El día de cobro debe ser un entero entre 1 y 31.", 400);
  }
  return numero;
}

function validarActiva(valor: unknown): boolean {
  if (typeof valor !== "boolean") {
    throw errorHttp("El campo activa debe ser booleano.", 400);
  }
  return valor;
}

async function validarUsuarioActivo(idUsuario: number): Promise<User> {
  const usuario = await User.findByPk(idUsuario);
  if (!usuario) {
    throw errorHttp("El usuario no existe.", 404);
  }
  if (!usuario.activo) {
    throw errorHttp("El usuario está inactivo.", 400);
  }
  return usuario;
}

async function validarTarjeta(idTarjeta: number, idUsuario: number): Promise<void> {
  const filas = (await sequelize.query(
    'SELECT "id" FROM "Tarjeta" WHERE "id" = :idTarjeta AND "idUsuario" = :idUsuario AND "activa" = true',
    {
      replacements: { idTarjeta, idUsuario },
      type: QueryTypes.SELECT,
    },
  )) as Array<{ id: number }>;

  if (filas.length === 0) {
    throw errorHttp("La tarjeta no existe, está inactiva o no pertenece al usuario.", 400);
  }
}

export async function listarSuscripciones(
  paginacion: PaginationParams,
  filtros: FiltrosSuscripcion = {},
) {
  const where: WhereOptions = {};

  if (paginacion.search) {
    (where as any)[Op.or] = [
      { proveedor: { [Op.iLike]: `%${paginacion.search}%` } },
      { plan: { [Op.iLike]: `%${paginacion.search}%` } },
    ];
  }
  if (filtros.idUsuario !== undefined) {
    (where as any).idUsuario = filtros.idUsuario;
  }
  if (filtros.activa !== undefined) {
    (where as any).activa = filtros.activa;
  }

  const { rows, count } = await Suscripcion.findAndCountAll({
    where,
    limit: paginacion.limit,
    offset: paginacion.offset,
    order: paginacion.order,
  });

  return {
    data: rows,
    total: count,
    page: paginacion.page,
    limit: paginacion.limit,
  };
}

export async function obtenerSuscripcionPorId(idSuscripcion: number, idUsuario?: number) {
  const suscripcion = idUsuario
    ? await Suscripcion.findOne({ where: { idSuscripcion, idUsuario } })
    : await Suscripcion.findByPk(idSuscripcion);
  if (!suscripcion) {
    throw errorHttp("La suscripción no existe.", 404);
  }
  return suscripcion;
}

export async function crearSuscripcion(data: CrearSuscripcionDTO) {
  const idUsuario = validarId(data.idUsuario, "idUsuario");
  const proveedor = validarTexto(data.proveedor, "proveedor", 100);
  const plan = validarTexto(data.plan, "plan", 100);
  const monto = validarMonto(data.monto);
  const diaCobro = validarDiaCobro(data.diaCobro);
  const activa = data.activa === undefined ? true : validarActiva(data.activa);

  const idTarjeta =
    data.idTarjeta === undefined || data.idTarjeta === null
      ? null
      : validarId(data.idTarjeta, "idTarjeta");

  await validarUsuarioActivo(idUsuario);
  if (idTarjeta !== null) {
    await validarTarjeta(idTarjeta, idUsuario);
  }

  return Suscripcion.create({
    idUsuario,
    idTarjeta,
    proveedor,
    plan,
    monto,
    diaCobro,
    activa,
  });
}

export async function editarSuscripcion(
  idSuscripcion: number,
  data: EditarSuscripcionDTO,
  idUsuario?: number,
) {
  if (data.idUsuario !== undefined) {
    throw errorHttp("No se permite modificar el propietario de la suscripción.", 400);
  }

  const suscripcion = idUsuario
    ? await Suscripcion.findOne({ where: { idSuscripcion, idUsuario } })
    : await Suscripcion.findByPk(idSuscripcion);
  if (!suscripcion) {
    throw errorHttp("La suscripción no existe.", 404);
  }

  if (data.idTarjeta !== undefined) {
    if (data.idTarjeta === null) {
      suscripcion.idTarjeta = null;
    } else {
      const idTarjeta = validarId(data.idTarjeta, "idTarjeta");
      await validarTarjeta(idTarjeta, suscripcion.idUsuario);
      suscripcion.idTarjeta = idTarjeta;
    }
  }
  if (data.proveedor !== undefined) {
    suscripcion.proveedor = validarTexto(data.proveedor, "proveedor", 100);
  }
  if (data.plan !== undefined) {
    suscripcion.plan = validarTexto(data.plan, "plan", 100);
  }
  if (data.monto !== undefined) {
    suscripcion.monto = validarMonto(data.monto);
  }
  if (data.diaCobro !== undefined) {
    suscripcion.diaCobro = validarDiaCobro(data.diaCobro);
  }
  if (data.activa !== undefined) {
    suscripcion.activa = validarActiva(data.activa);
  }

  await suscripcion.save();
  return suscripcion;
}

export async function eliminarSuscripcion(idSuscripcion: number, idUsuario?: number) {
  const suscripcion = idUsuario
    ? await Suscripcion.findOne({ where: { idSuscripcion, idUsuario } })
    : await Suscripcion.findByPk(idSuscripcion);
  if (!suscripcion) {
    throw errorHttp("La suscripción no existe.", 404);
  }

  await suscripcion.destroy();
  return suscripcion;
}
