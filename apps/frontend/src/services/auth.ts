import { apiGet, apiPost, borrarToken, guardarToken } from "./api";
import type { Usuario } from "../types/finanzas";

export interface RespuestaAuth {
  token: string;
  usuario: Usuario;
}

export interface RespuestaRecuperacion {
  mensaje: string;
  resetUrl?: string;
}

export async function login(email: string, password: string): Promise<Usuario> {
  const respuesta = await apiPost<RespuestaAuth>("/api/auth/login", {
    email,
    password,
  });
  guardarToken(respuesta.token);
  return respuesta.usuario;
}

export async function register(
  nombre: string,
  email: string,
  password: string,
  telefono?: string,
): Promise<Usuario> {
  const respuesta = await apiPost<RespuestaAuth>("/api/auth/register", {
    nombre,
    email,
    password,
    telefono: telefono?.trim() || undefined,
  });
  guardarToken(respuesta.token);
  return respuesta.usuario;
}

export async function obtenerPerfil(): Promise<Usuario> {
  return await apiGet<Usuario>("/api/auth/me");
}

export async function forgotPassword(email: string): Promise<RespuestaRecuperacion> {
  return await apiPost<RespuestaRecuperacion>("/api/auth/forgot-password", {
    email,
  });
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<{ mensaje: string }> {
  return await apiPost<{ mensaje: string }>("/api/auth/reset-password", {
    token,
    password,
  });
}

export async function changePassword(
  passwordActual: string,
  passwordNueva: string,
): Promise<{ mensaje: string }> {
  return await apiPost<{ mensaje: string }>("/api/auth/change-password", {
    passwordActual,
    passwordNueva,
  });
}

export function logout(): void {
  borrarToken();
}
