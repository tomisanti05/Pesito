import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../services/auth";
import "./auth.css";

function mensajeDeError(error: unknown): string {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [token] = useState(() => params.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();

    if (password !== password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      await resetPassword(token, password);
      navigate("/login", { replace: true });
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Nueva contraseña</h1>
        <p className="auth-subtitulo">Definí tu nueva contraseña</p>

        {error && <div className="auth-error" role="alert">{error}</div>}
        {!token && (
          <div className="auth-error" role="alert">
            Falta el token de recuperación. Usá el enlace que te enviamos por
            email.
          </div>
        )}

        <form onSubmit={(evento) => void enviar(evento)}>
          <label className="auth-campo">
            <span>Contraseña nueva</span>
            <input
              type="password"
              minLength={8}
              value={password}
              onChange={(evento) => setPassword(evento.target.value)}
              required
              disabled={!token}
              autoFocus
              autoComplete="new-password"
            />
          </label>

          <label className="auth-campo">
            <span>Repetir contraseña</span>
            <input
              type="password"
              minLength={8}
              value={password2}
              onChange={(evento) => setPassword2(evento.target.value)}
              required
              disabled={!token}
              autoComplete="new-password"
            />
          </label>

          <button
            type="submit"
            className="auth-boton"
            disabled={enviando || !token}
          >
            {enviando ? "Guardando…" : "Guardar contraseña"}
          </button>
        </form>

        <div className="auth-links">
          <span>
            <Link to="/login">Volver a iniciar sesión</Link>
          </span>
        </div>
      </div>
    </div>
  );
}
