import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { login } from "../services/auth";
import "./auth.css";

function mensajeDeError(error: unknown): string {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

export default function Login() {
  const { recargar } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);

    try {
      await login(email.trim(), password);
      await recargar();
      navigate("/inicio", { replace: true });
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Iniciar sesión</h1>
        <p className="auth-subtitulo">Entrá a tu cuenta de Pesito</p>

        {error && <div className="auth-error" role="alert">{error}</div>}

        <form onSubmit={(evento) => void enviar(evento)}>
          <label className="auth-campo">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              required
              autoFocus
              autoComplete="email"
            />
          </label>

          <label className="auth-campo">
            <span>Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(evento) => setPassword(evento.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          <button type="submit" className="auth-boton" disabled={enviando}>
            {enviando ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password">Olvidé mi contraseña</Link>
          <span>
            ¿No tenés cuenta? <Link to="/register">Registrate</Link>
          </span>
        </div>
      </div>
    </div>
  );
}
