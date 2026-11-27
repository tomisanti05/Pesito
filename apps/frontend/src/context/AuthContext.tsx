import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { obtenerPerfil, logout as cerrarSesionServicio } from "../services/auth";
import { leerToken } from "../services/api";
import { AuthContext, type AuthContexto } from "./useAuth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<AuthContexto["usuario"]>(null);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    if (!leerToken()) {
      setUsuario(null);
      setCargando(false);
      return;
    }

    setCargando(true);
    try {
      setUsuario(await obtenerPerfil());
    } catch {
      // Token inválido o expirado: el api ya lo borró del localStorage.
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    // El estado se actualiza después de los await, no de forma sincrónica.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void recargar();
  }, [recargar]);

  const cerrarSesion = useCallback(() => {
    cerrarSesionServicio();
    setUsuario(null);
  }, []);

  const valor = useMemo<AuthContexto>(
    () => ({ usuario, cargando, recargar, cerrarSesion }),
    [usuario, cargando, recargar, cerrarSesion],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
