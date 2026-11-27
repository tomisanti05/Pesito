import { Op, type WhereOptions } from "sequelize";
import User from "../models/user.js";
import Tarjeta, { type TipoTarjeta } from "../models/tarjeta.js";
import type { PaginationParams } from "../../utils/pagination.js";

const TITULAR_MAX = 100;
const TITULAR_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?: [A-Za-zÀ-ÖØ-öø-ÿ]+)*$/;
const VENCIMIENTO_REGEX = /^(0[1-9]|1[0-2])\/\d{2}$/;
const TIPOS: readonly TipoTarjeta[] = ["visa", "mastercard", "amex", "otra"];
const CAMPOS_EDITABLES = [
  "tipo",
  "ultimosCuatro",
  "titular",
  "vencimiento",
  "activa",
] as const;

export const CAMPOS_ORDEN_TARJETA = [
  "id",
  "tipo",
  "ultimosCuatro",
  "titular",
  "vencimiento",
  "activa",
  "createdAt",
  "updatedAt",
] as const;

export interface CrearTarjetaDTO {
  idUsuario: unknown;
  tipo: unknown;
  ultimosCuatro: unknown;
  titular: unknown;
  vencimiento: unknown;
  activa?: unknown;
}

export interface EditarTarjetaDTO {
  tipo?: unknown;
  ultimosCuatro?: unknown;
  titular?: unknown;
  vencimiento?: unknown;
  activa?: unknown;
}

export interface FiltrosTarjeta {
  idUsuario?: number;
  activa?: boolean;
  tipo?: TipoTarjeta;
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

function validarTipo(valor: unknown): TipoTarjeta {
  if (typeof valor !== "string" || !TIPOS.includes(valor as TipoTarjeta)) {
    throw errorHttp("El tipo debe ser visa, mastercard, amex u otra.", 400);
  }
  return valor as TipoTarjeta;
}

function validarUltimosCuatro(valor: unknown): string {
  if (typeof valor !== "string") {
    throw errorHttp("Los últimos cuatro deben ser un texto de 4 dígitos.", 400);
  }

  const limpio = valor.trim();
  if (!/^\d{4}$/.test(limpio)) {
    throw errorHttp("Los últimos cuatro deben ser exactamente 4 dígitos.", 400);
  }

  return limpio;
}

function validarTitular(valor: unknown): string {
  if (typeof valor !== "string") {
    throw errorHttp("El titular es obligatorio.", 400);
  }

  const limpio = valor.trim();
  if (limpio.length === 0) {
    throw errorHttp("El titular es obligatorio.", 400);
  }
  if (limpio.length > TITULAR_MAX) {
    throw errorHttp(`El titular no puede superar los ${TITULAR_MAX} caracteres.`, 400);
  }
  if (!TITULAR_REGEX.test(limpio)) {
    throw errorHttp("El titular solo puede contener letras y espacios.", 400);
  }

  return limpio;
}

function validarVencimiento(valor: unknown): string {
  if (typeof valor !== "string") {
    throw errorHttp("El vencimiento es obligatorio.", 400);
  }

  const limpio = valor.trim();
  if (!VENCIMIENTO_REGEX.test(limpio)) {
    throw errorHttp("El vencimiento debe tener el formato MM/YY.", 400);
  }

  return limpio;
}

function validarActiva(valor: unknown): boolean {
  if (typeof valor !== "boolean") {
    throw errorHttp("El campo activa debe ser booleano.", 400);
  }
  return valor;
}

async function validarUsuarioActivo(idUsuario: number): Promise<void> {
  const usuario = await User.findByPk(idUsuario);
  if (!usuario) {
    throw errorHttp("El usuario no existe.", 404);
  }
  if (!usuario.activo) {
    throw errorHttp("El usuario está inactivo.", 400);
  }
}

export async function listarTarjetas(
  paginacion: PaginationParams,
  filtros: FiltrosTarjeta = {},
) {
  const where: WhereOptions = {};

  if (paginacion.search) {
    (where as any)[Op.or] = [
      { titular: { [Op.iLike]: `%${paginacion.search}%` } },
      { ultimosCuatro: { [Op.iLike]: `%${paginacion.search}%` } },
      { tipo: { [Op.iLike]: `%${paginacion.search}%` } },
    ];
  }
  if (filtros.idUsuario !== undefined) {
    (where as any).idUsuario = filtros.idUsuario;
  }
  if (filtros.activa !== undefined) {
    (where as any).activa = filtros.activa;
  }
  if (filtros.tipo !== undefined) {
    (where as any).tipo = filtros.tipo;
  }

  const { rows, count } = await Tarjeta.findAndCountAll({
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

export async function obtenerTarjetaPorId(id: unknown, idUsuario?: number) {
  const idTarjeta = validarId(id, "id");

  const tarjeta = idUsuario
    ? await Tarjeta.findOne({ where: { id: idTarjeta, idUsuario } })
    : await Tarjeta.findByPk(idTarjeta);
  if (!tarjeta) {
    throw errorHttp("La tarjeta no existe.", 404);
  }

  return tarjeta;
}

export async function crearTarjeta(data: CrearTarjetaDTO) {
  const idUsuario = validarId(data.idUsuario, "idUsuario");
  const tipo = validarTipo(data.tipo);
  const ultimosCuatro = validarUltimosCuatro(data.ultimosCuatro);
  const titular = validarTitular(data.titular);
  const vencimiento = validarVencimiento(data.vencimiento);
  const activa = data.activa === undefined ? true : validarActiva(data.activa);

  await validarUsuarioActivo(idUsuario);

  return Tarjeta.create({
    idUsuario,
    tipo,
    ultimosCuatro,
    titular,
    vencimiento,
    activa,
  });
}

export async function editarTarjeta(id: unknown, data: EditarTarjetaDTO, idUsuario?: number) {
  const idTarjeta = validarId(id, "id");

  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw errorHttp("Los datos enviados no son válidos.", 400);
  }
  if ("idUsuario" in data) {
    throw errorHttp("No se permite modificar el propietario de la tarjeta.", 400);
  }

  const claves = Object.keys(data);
  const desconocidas = claves.filter(
    (clave) => !CAMPOS_EDITABLES.includes(clave as (typeof CAMPOS_EDITABLES)[number]),
  );
  if (desconocidas.length > 0) {
    throw errorHttp(`No se puede modificar: ${desconocidas.join(", ")}.`, 400);
  }
  if (claves.length === 0) {
    throw errorHttp("No se enviaron datos para actualizar.", 400);
  }

  const tarjeta = idUsuario
    ? await Tarjeta.findOne({ where: { id: idTarjeta, idUsuario } })
    : await Tarjeta.findByPk(idTarjeta);
  if (!tarjeta) {
    throw errorHttp("La tarjeta no existe.", 404);
  }

  let cambios = 0;

  if (data.tipo !== undefined) {
    tarjeta.tipo = validarTipo(data.tipo);
    cambios += 1;
  }
  if (data.ultimosCuatro !== undefined) {
    tarjeta.ultimosCuatro = validarUltimosCuatro(data.ultimosCuatro);
    cambios += 1;
  }
  if (data.titular !== undefined) {
    tarjeta.titular = validarTitular(data.titular);
    cambios += 1;
  }
  if (data.vencimiento !== undefined) {
    tarjeta.vencimiento = validarVencimiento(data.vencimiento);
    cambios += 1;
  }
  if (data.activa !== undefined) {
    tarjeta.activa = validarActiva(data.activa);
    cambios += 1;
  }

  if (cambios === 0) {
    throw errorHttp("No se enviaron datos para actualizar.", 400);
  }

  await tarjeta.save();
  return tarjeta;
}

export async function eliminarTarjeta(id: unknown, idUsuario?: number) {
  const idTarjeta = validarId(id, "id");

  const tarjeta = idUsuario
    ? await Tarjeta.findOne({ where: { id: idTarjeta, idUsuario } })
    : await Tarjeta.findByPk(idTarjeta);
  if (!tarjeta) {
    throw errorHttp("La tarjeta no existe.", 404);
  }

  await tarjeta.destroy();
  return tarjeta;
}
