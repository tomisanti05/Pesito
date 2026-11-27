import jwt, { type SignOptions } from "jsonwebtoken";
import { authConfig, validarConfigAuth } from "../config/auth.js";
import type { RolUsuario } from "../modules/models/user.js";
import { HttpError } from "./httpError.js";

export interface UsuarioAutenticado {
  id: number;
  rol: RolUsuario;
}

export function firmarToken(usuario: {
  id: number;
  rol: RolUsuario;
}): string {
  validarConfigAuth();

  return jwt.sign({ rol: usuario.rol }, authConfig.jwtSecret, {
    subject: String(usuario.id),
    expiresIn: authConfig.jwtExpiresIn as SignOptions["expiresIn"],
  });
}

export function verificarToken(token: string): UsuarioAutenticado {
  validarConfigAuth();

  try {
    const payload = jwt.verify(token, authConfig.jwtSecret);

    if (typeof payload === "string" || payload.sub === undefined) {
      throw new Error("Token sin sujeto.");
    }

    const id = Number(payload.sub);
    const rol = payload.rol;

    if (
      !Number.isInteger(id) ||
      id <= 0 ||
      (rol !== "usuario" && rol !== "admin")
    ) {
      throw new Error("Token con datos inválidos.");
    }

    return { id, rol };
  } catch {
    throw new HttpError(401, "Sesión inválida o expirada.");
  }
}
