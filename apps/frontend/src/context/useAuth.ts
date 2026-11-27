import { createContext, useContext } from "react";
import type { Usuario } from "../types/finanzas";

export interface AuthContexto {
  usuario: Usuario | null;
  cargando: boolean;
  recargar: () => Promise<void>;
  cerrarSesion: () => void;
}

export const AuthContext = createContext<AuthContexto | null>(null);

export function useAuth(): AuthContexto {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error("useAuth tiene que usarse dentro de AuthProvider.");
  }
  return contexto;
}
