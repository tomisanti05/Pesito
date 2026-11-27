import path from "node:path";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(import.meta.dirname, "../../../../.env"),
  quiet: true,
});

const SECRETO_SOLO_DESARROLLO = "desarrollo-solo-cambiar-en-produccion";

function numeroPositivo(valor: string | undefined, porDefecto: number): number {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? numero : porDefecto;
}

export const authConfig = {
  jwtSecret:
    process.env.JWT_SECRET?.trim() ||
    (process.env.NODE_ENV === "production" ? "" : SECRETO_SOLO_DESARROLLO),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN?.trim() || "7d",
  resetTokenTtlMinutes: numeroPositivo(process.env.RESET_TOKEN_TTL_MIN, 30),
  frontendUrl: process.env.FRONTEND_URL?.trim().replace(/\/+$/, "") || "",
  passwordSaltRounds: numeroPositivo(process.env.PASSWORD_SALT_ROUNDS, 10),
  passwordMinLength: 8,
  passwordMaxLength: 72,
  resetTokenBytes: 32,
} as const;

export function validarConfigAuth(): void {
  if (!authConfig.jwtSecret) {
    throw new Error(
      "Falta la variable de entorno JWT_SECRET. Definila antes de iniciar el servidor.",
    );
  }
}
