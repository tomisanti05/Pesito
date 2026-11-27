import { createHash, randomBytes } from "node:crypto";
import { authConfig } from "../../config/auth.js";
import { HttpError } from "../../utils/httpError.js";
import {
  compararPassword,
  hashearPassword,
  validarPassword,
} from "../../utils/password.js";
import { firmarToken } from "../../utils/jwt.js";
import PasswordResetToken from "../models/passwordResetToken.js";
import User, { type RolUsuario } from "../models/user.js";
import { crearUsuario, type CrearUsuarioInput } from "./userServices.js";

const MENSAJE_RECUPERACION =
  "Si el email está registrado, te enviamos un enlace para restablecer la contraseña.";

export interface RegistroInput {
  nombre?: unknown;
  email?: unknown;
  telefono?: unknown;
  password?: unknown;
}

export interface LoginInput {
  email?: unknown;
  password?: unknown;
}

export interface ResetPasswordInput {
  token?: unknown;
  password?: unknown;
}

export interface CambioPasswordInput {
  passwordActual?: unknown;
  passwordNueva?: unknown;
}

export interface UsuarioPublico {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  rol: RolUsuario;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  token: string;
  usuario: UsuarioPublico;
}

export function usuarioPublico(usuario: User): UsuarioPublico {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    telefono: usuario.telefono,
    rol: usuario.rol,
    activo: usuario.activo,
    createdAt: usuario.createdAt,
    updatedAt: usuario.updatedAt,
  };
}

function normalizarEmail(email: unknown): string {
  if (typeof email !== "string") {
    throw new HttpError(400, "El email es obligatorio.");
  }

  const limpio = email.trim().toLowerCase();

  if (limpio.length === 0) {
    throw new HttpError(400, "El email es obligatorio.");
  }

  return limpio;
}

function hashearToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function registrarUsuario(
  input: RegistroInput,
): Promise<AuthResponse> {
  const password = validarPassword(input?.password);

  const usuario = await crearUsuario({
    nombre: input?.nombre,
    email: input?.email,
    telefono: input?.telefono,
  } as CrearUsuarioInput);

  usuario.passwordHash = await hashearPassword(password);
  await usuario.save();

  return { token: firmarToken(usuario), usuario: usuarioPublico(usuario) };
}

export async function iniciarSesion(input: LoginInput): Promise<AuthResponse> {
  const email = normalizarEmail(input?.email);
  const password = typeof input?.password === "string" ? input.password : "";

  const usuario = await User.unscoped().findOne({ where: { email } });

  if (
    !usuario ||
    !usuario.passwordHash ||
    password.length === 0 ||
    !(await compararPassword(password, usuario.passwordHash))
  ) {
    throw new HttpError(401, "Email o contraseña incorrectos.");
  }

  if (!usuario.activo) {
    throw new HttpError(403, "La cuenta está deshabilitada.");
  }

  return { token: firmarToken(usuario), usuario: usuarioPublico(usuario) };
}

export async function solicitarRecuperacion(
  email: unknown,
  origen?: string,
): Promise<{ mensaje: string; resetUrl?: string }> {
  const normalizado = normalizarEmail(email);

  const usuario = await User.findOne({
    where: { email: normalizado, activo: true },
  });

  if (!usuario) {
    return { mensaje: MENSAJE_RECUPERACION };
  }

  const token = randomBytes(authConfig.resetTokenBytes).toString("hex");
  const tokenHash = hashearToken(token);
  const expiresAt = new Date(
    Date.now() + authConfig.resetTokenTtlMinutes * 60_000,
  );

  await PasswordResetToken.update(
    { usedAt: new Date() },
    { where: { idUsuario: usuario.id, usedAt: null } },
  );

  await PasswordResetToken.create({
    idUsuario: usuario.id,
    tokenHash,
    expiresAt,
  });

  const base = authConfig.frontendUrl || origen || "http://localhost:5173";
  const resetUrl = `${base}/reset-password?token=${token}`;

  if (process.env.NODE_ENV !== "production") {
    console.info(`[auth] Enlace de recuperación para ${normalizado}: ${resetUrl}`);
    return { mensaje: MENSAJE_RECUPERACION, resetUrl };
  }

  return { mensaje: MENSAJE_RECUPERACION };
}

export async function restablecerPassword(
  input: ResetPasswordInput,
): Promise<{ mensaje: string }> {
  const token = typeof input?.token === "string" ? input.token.trim() : "";
  const password = validarPassword(input?.password);

  if (token.length === 0) {
    throw new HttpError(400, "El enlace de recuperación no es válido.");
  }

  const registro = await PasswordResetToken.findOne({
    where: { tokenHash: hashearToken(token) },
  });

  if (
    !registro ||
    registro.usedAt ||
    registro.expiresAt.getTime() <= Date.now()
  ) {
    throw new HttpError(
      400,
      "El enlace de recuperación es inválido o expiró.",
    );
  }

  const usuario = await User.findByPk(registro.idUsuario);

  if (!usuario) {
    throw new HttpError(400, "El enlace de recuperación es inválido o expiró.");
  }
  if (!usuario.activo) {
    throw new HttpError(403, "La cuenta está deshabilitada.");
  }

  usuario.passwordHash = await hashearPassword(password);
  await usuario.save();

  await PasswordResetToken.update(
    { usedAt: new Date() },
    { where: { idUsuario: usuario.id, usedAt: null } },
  );

  return { mensaje: "Contraseña actualizada. Ya podés iniciar sesión." };
}

export async function cambiarPassword(
  idUsuario: number,
  input: CambioPasswordInput,
): Promise<{ mensaje: string }> {
  const usuario = await User.unscoped().findByPk(idUsuario);

  if (!usuario) {
    throw new HttpError(404, "Usuario no encontrado.");
  }
  if (!usuario.passwordHash) {
    throw new HttpError(
      400,
      "La cuenta no tiene una contraseña configurada.",
    );
  }

  const actual = typeof input?.passwordActual === "string" ? input.passwordActual : "";

  if (!(await compararPassword(actual, usuario.passwordHash))) {
    throw new HttpError(400, "La contraseña actual no es correcta.");
  }

  const nueva = validarPassword(input?.passwordNueva);

  if (actual === nueva) {
    throw new HttpError(
      400,
      "La nueva contraseña debe ser distinta de la actual.",
    );
  }

  usuario.passwordHash = await hashearPassword(nueva);
  await usuario.save();

  await PasswordResetToken.update(
    { usedAt: new Date() },
    { where: { idUsuario: usuario.id, usedAt: null } },
  );

  return { mensaje: "Contraseña actualizada." };
}

export async function obtenerPerfil(idUsuario: number): Promise<UsuarioPublico> {
  const usuario = await User.findByPk(idUsuario);

  if (!usuario) {
    throw new HttpError(404, "Usuario no encontrado.");
  }

  return usuarioPublico(usuario);
}
