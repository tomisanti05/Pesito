import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { register } from "../services/auth";
import "./auth.css";

function mensajeDeError(error: unknown): string {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

export default function Register() {
  const { recargar } = useAuth();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
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
      await register(nombre.trim(), email.trim(), password, telefono);
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
        <h1>Crear cuenta</h1>
        <p className="auth-subtitulo">Empezá a gestionar tus finanzas hoy</p>

        {error && <div className="auth-error" role="alert">{error}</div>}

        <form onSubmit={(evento) => void enviar(evento)}>
          <label className="auth-campo">
            <span>Nombre y apellido</span>
            <input
              type="text"
              maxLength={100}
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              required
              autoFocus
              autoComplete="name"
            />
          </label>

          <label className="auth-campo">
            <span>Email</span>
            <input
              type="email"
              maxLength={150}
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label className="auth-campo">
            <span>Teléfono</span>
            <input
              type="tel"
              maxLength={30}
              placeholder="Opcional"
              value={telefono}
              onChange={(evento) => setTelefono(evento.target.value)}
              autoComplete="tel"
            />
          </label>

          <label className="auth-campo">
            <span>Contraseña</span>
            <input
              type="password"
              minLength={8}
              value={password}
              onChange={(evento) => setPassword(evento.target.value)}
              required
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
              autoComplete="new-password"
            />
          </label>

          <button type="submit" className="auth-boton" disabled={enviando}>
            {enviando ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>

        <div className="auth-links">
          <span>
            ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
          </span>
        </div>
      </div>
    </div>
  );
}
