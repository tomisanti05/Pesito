import bcrypt from "bcryptjs";
import { authConfig } from "../config/auth.js";
import { HttpError } from "./httpError.js";

const PASSWORD_MAX_BYTES = 72;

export function validarPassword(password: unknown): string {
  if (typeof password !== "string" || password.length === 0) {
    throw new HttpError(400, "La contraseña es obligatoria.");
  }
  if (password.length < authConfig.passwordMinLength) {
    throw new HttpError(
      400,
      `La contraseña debe tener al menos ${authConfig.passwordMinLength} caracteres.`,
    );
  }
  if (Buffer.byteLength(password, "utf8") > PASSWORD_MAX_BYTES) {
    throw new HttpError(
      400,
      `La contraseña no puede superar los ${PASSWORD_MAX_BYTES} caracteres.`,
    );
  }

  return password;
}

export function hashearPassword(password: string): Promise<string> {
  return bcrypt.hash(password, authConfig.passwordSaltRounds);
}

export function compararPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
