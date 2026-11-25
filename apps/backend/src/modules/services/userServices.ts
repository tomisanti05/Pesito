import { Op, UniqueConstraintError, type WhereOptions } from "sequelize";
import User, { type RolUsuario } from "../models/user.js";
import type { PaginationParams } from "../../utils/pagination.js";

const NOMBRE_MAX = 100;
const EMAIL_MAX = 150;
const TELEFONO_MAX = 30;
const NOMBRE_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?: [A-Za-zÀ-ÖØ-öø-ÿ]+)*$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO_REGEX = /^[0-9+()\s-]+$/;
const ROLES: readonly RolUsuario[] = ["usuario", "admin"];
const CAMPOS_EDITABLES = ["nombre", "email", "telefono", "rol", "activo"] as const;

export const CAMPOS_ORDEN_USUARIO = [
  "id",
  "nombre",
  "email",
  "rol",
  "activo",
  "createdAt",
  "updatedAt",
] as const;

export class HttpError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
  }
}

export interface CrearUsuarioInput {
  nombre: string;
  email: string;
  telefono?: unknown;
}

export interface EditarUsuarioInput {
  nombre?: unknown;
  email?: unknown;
  telefono?: unknown;
  rol?: unknown;
  activo?: unknown;
}

export interface FiltrosUsuario {
  rol?: RolUsuario;
  activo?: boolean;
}

function validarNombre(nombre: unknown): string {
  if (typeof nombre !== "string") {
    throw new HttpError(400, "El nombre es obligatorio.");
  }

  const limpio = nombre.trim();

  if (limpio.length === 0) {
    throw new HttpError(400, "El nombre es obligatorio.");
  }
  if (limpio.length > NOMBRE_MAX) {
    throw new HttpError(400, `El nombre no puede superar los ${NOMBRE_MAX} caracteres.`);
  }
  if (!NOMBRE_REGEX.test(limpio)) {
    throw new HttpError(400, "El nombre solo puede contener letras y espacios.");
  }

  return limpio;
}

function validarEmail(email: unknown): string {
  if (typeof email !== "string") {
    throw new HttpError(400, "El email es obligatorio.");
  }

  const limpio = email.trim().toLowerCase();

  if (limpio.length === 0) {
    throw new HttpError(400, "El email es obligatorio.");
  }
  if (limpio.length > EMAIL_MAX) {
    throw new HttpError(400, `El email no puede superar los ${EMAIL_MAX} caracteres.`);
  }
  if (!EMAIL_REGEX.test(limpio)) {
    throw new HttpError(400, "El email no tiene un formato válido.");
  }

  return limpio;
}

function validarTelefono(telefono: unknown): string | null {
  if (telefono === undefined || telefono === null) {
    return null;
  }
  if (typeof telefono !== "string") {
    throw new HttpError(400, "El teléfono debe ser texto.");
  }

  const limpio = telefono.trim();

  if (limpio.length === 0) {
    return null;
  }
  if (limpio.length > TELEFONO_MAX) {
    throw new HttpError(400, `El teléfono no puede superar los ${TELEFONO_MAX} caracteres.`);
  }
  if (!TELEFONO_REGEX.test(limpio)) {
    throw new HttpError(400, "El teléfono solo puede contener números, espacios y los signos +, -, ( ).");
  }

  return limpio;
}

function validarRol(rol: unknown): RolUsuario {
  if (typeof rol !== "string" || !ROLES.includes(rol as RolUsuario)) {
    throw new HttpError(400, "El rol debe ser usuario o admin.");
  }

  return rol as RolUsuario;
}

function validarActivo(activo: unknown): boolean {
  if (typeof activo !== "boolean") {
    throw new HttpError(400, "El campo activo debe ser booleano.");
  }

  return activo;
}

function validarId(id: unknown): number {
  const numero = typeof id === "number" ? id : Number(id);

  if (!Number.isInteger(numero) || numero <= 0) {
    throw new HttpError(400, "El id debe ser un entero positivo.");
  }

  return numero;
}

function validarDatosEdicion(data: EditarUsuarioInput): void {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new HttpError(400, "Los datos enviados no son válidos.");
  }

  const claves = Object.keys(data);
  const desconocidas = claves.filter(
    (clave) => !CAMPOS_EDITABLES.includes(clave as (typeof CAMPOS_EDITABLES)[number]),
  );

  if (desconocidas.length > 0) {
    throw new HttpError(
      400,
      `No se puede modificar: ${desconocidas.join(", ")}.`,
    );
  }
  if (claves.length === 0) {
    throw new HttpError(400, "No se enviaron datos para actualizar.");
  }
}

export async function crearUsuario(input: CrearUsuarioInput): Promise<User> {
  const nombre = validarNombre(input?.nombre);
  const email = validarEmail(input?.email);
  const telefono = validarTelefono(input?.telefono);

  const existente = await User.findOne({ where: { email } });
  if (existente) {
    throw new HttpError(409, "Ya existe un usuario con ese email.");
  }

  try {
    return await User.create({ nombre, email, telefono });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new HttpError(409, "Ya existe un usuario con ese email.");
    }
    throw error;
  }
}

export async function listarUsuarios(
  paginacion: PaginationParams,
  filtros: FiltrosUsuario = {},
) {
  const where: WhereOptions = {};

  if (paginacion.search) {
    (where as any)[Op.or] = [
      { nombre: { [Op.iLike]: `%${paginacion.search}%` } },
      { email: { [Op.iLike]: `%${paginacion.search}%` } },
      { telefono: { [Op.iLike]: `%${paginacion.search}%` } },
    ];
  }
  if (filtros.rol !== undefined) {
    (where as any).rol = filtros.rol;
  }
  if (filtros.activo !== undefined) {
    (where as any).activo = filtros.activo;
  }

  const { rows, count } = await User.findAndCountAll({
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

export async function obtenerUsuario(id: unknown): Promise<User> {
  const idNumerico = validarId(id);

  const usuario = await User.findByPk(idNumerico);
  if (!usuario) {
    throw new HttpError(404, "Usuario no encontrado.");
  }

  return usuario;
}

export async function editarUsuario(
  id: unknown,
  data: EditarUsuarioInput,
): Promise<User> {
  const idNumerico = validarId(id);
  validarDatosEdicion(data);

  const usuario = await User.findByPk(idNumerico);
  if (!usuario) {
    throw new HttpError(404, "Usuario no encontrado.");
  }

  let cambios = 0;

  if (data.nombre !== undefined) {
    usuario.nombre = validarNombre(data.nombre);
    cambios += 1;
  }
  if (data.email !== undefined) {
    const email = validarEmail(data.email);

    if (email !== usuario.email) {
      const existente = await User.findOne({
        where: { email, id: { [Op.ne]: idNumerico } },
      });
      if (existente) {
        throw new HttpError(409, "Ya existe un usuario con ese email.");
      }
    }

    usuario.email = email;
    cambios += 1;
  }
  if (data.telefono !== undefined) {
    usuario.telefono = validarTelefono(data.telefono);
    cambios += 1;
  }
  if (data.rol !== undefined) {
    usuario.rol = validarRol(data.rol);
    cambios += 1;
  }
  if (data.activo !== undefined) {
    usuario.activo = validarActivo(data.activo);
    cambios += 1;
  }

  if (cambios === 0) {
    throw new HttpError(400, "No se enviaron datos para actualizar.");
  }

  try {
    await usuario.save();
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new HttpError(409, "Ya existe un usuario con ese email.");
    }
    throw error;
  }

  return usuario;
}

export async function eliminarUsuario(id: unknown): Promise<User> {
  const idNumerico = validarId(id);

  const usuario = await User.findByPk(idNumerico);
  if (!usuario) {
    throw new HttpError(404, "Usuario no encontrado.");
  }

  if (usuario.activo) {
    usuario.activo = false;
    await usuario.save();
  }

  return usuario;
}
