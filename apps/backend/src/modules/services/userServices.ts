import { UniqueConstraintError } from "sequelize";
import { User } from "../models/index.js";

const NOMBRE_MAX = 100;
const EMAIL_MAX = 150;
const NOMBRE_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?: [A-Za-zÀ-ÖØ-öø-ÿ]+)*$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function validarId(id: unknown): number {
  const numero = typeof id === "number" ? id : Number(id);

  if (!Number.isInteger(numero) || numero <= 0) {
    throw new HttpError(400, "El id debe ser un entero positivo.");
  }

  return numero;
}

export async function crearUsuario(input: CrearUsuarioInput): Promise<User> {
  const nombre = validarNombre(input?.nombre);
  const email = validarEmail(input?.email);

  const existente = await User.findOne({ where: { email } });
  if (existente) {
    throw new HttpError(409, "Ya existe un usuario con ese email.");
  }

  try {
    return await User.create({ nombre, email });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new HttpError(409, "Ya existe un usuario con ese email.");
    }
    throw error;
  }
}

export async function listarUsuarios(): Promise<User[]> {
  return User.findAll({ order: [["id", "ASC"]] });
}

export async function obtenerUsuario(id: unknown): Promise<User> {
  const idNumerico = validarId(id);

  const usuario = await User.findByPk(idNumerico);
  if (!usuario) {
    throw new HttpError(404, "Usuario no encontrado.");
  }

  return usuario;
}
