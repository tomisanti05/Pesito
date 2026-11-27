import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/auth";
import "./auth.css";

function mensajeDeError(error: unknown): string {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    setMensaje(null);
    setResetUrl(null);

    try {
      const respuesta = await forgotPassword(email.trim());
      setMensaje(respuesta.mensaje);
      if (respuesta.resetUrl) setResetUrl(respuesta.resetUrl);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Recuperar contraseña</h1>
        <p className="auth-subtitulo">
          Te enviamos un enlace para restablecerla
        </p>

        {error && <div className="auth-error" role="alert">{error}</div>}
        {mensaje && (
          <div className="auth-exito" role="status">
            {mensaje}
            {resetUrl && (
              <p className="auth-reset-url">
                (Desarrollo) Enlace directo:{" "}
                <a href={resetUrl}>{resetUrl}</a>
              </p>
            )}
          </div>
        )}

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

          <button type="submit" className="auth-boton" disabled={enviando}>
            {enviando ? "Enviando…" : "Enviar enlace"}
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
