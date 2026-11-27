import { useEffect, useState, type FormEvent } from "react";
import "./account.css";
import { Mail, Pencil, Phone } from "lucide-react";
import { apiPatch } from "../services/api";
import { changePassword } from "../services/auth";
import { useAuth } from "../context/useAuth";
import type { RolUsuario, Usuario } from "../types/finanzas";

interface FormUsuario {
  nombre: string;
  email: string;
  telefono: string;
}

interface FormPassword {
  passwordActual: string;
  passwordNueva: string;
  passwordRepetir: string;
}

const FORM_PASSWORD_VACIO: FormPassword = {
  passwordActual: "",
  passwordNueva: "",
  passwordRepetir: "",
};

function mensajeDeError(error: unknown): string {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

function obtenerIniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join("");
}

function etiquetaRol(rol: RolUsuario): string {
  return rol === "admin" ? "Administrador" : "Usuario";
}

function formatearFechaAlta(fecha: string): string {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return "Sin fecha";

  return valor.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function Account() {
  const { usuario, recargar } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState<FormUsuario>({
    nombre: "",
    email: "",
    telefono: "",
  });
  const [guardando, setGuardando] = useState(false);

  const [formPassword, setFormPassword] = useState<FormPassword>(
    FORM_PASSWORD_VACIO,
  );
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [errorPassword, setErrorPassword] = useState<string | null>(null);
  const [exitoPassword, setExitoPassword] = useState<string | null>(null);

  useEffect(() => {
    if (!modalAbierto) return;

    const alPresionarTecla = (evento: KeyboardEvent) => {
      if (evento.key !== "Escape" || guardando) return;
      setModalAbierto(false);
    };

    window.addEventListener("keydown", alPresionarTecla);
    return () => window.removeEventListener("keydown", alPresionarTecla);
  }, [modalAbierto, guardando]);

  function abrirEditar() {
    if (!usuario) return;
    setForm({
      nombre: usuario.nombre,
      email: usuario.email,
      telefono: usuario.telefono ?? "",
    });
    setExito(null);
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (guardando) return;
    setModalAbierto(false);
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    if (!usuario) return;

    setGuardando(true);
    setError(null);
    setExito(null);

    try {
      await apiPatch<Usuario>(
        `/api/users/${usuario.id}`,
        {
          nombre: form.nombre.trim(),
          email: form.email.trim().toLowerCase(),
          telefono: form.telefono.trim() || null,
        },
      );
      setModalAbierto(false);
      setExito("Datos actualizados.");
      await recargar();
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  }

  async function guardarPassword(evento: FormEvent) {
    evento.preventDefault();

    if (formPassword.passwordNueva !== formPassword.passwordRepetir) {
      setErrorPassword("Las contraseñas nuevas no coinciden.");
      return;
    }

    setGuardandoPassword(true);
    setErrorPassword(null);
    setExitoPassword(null);

    try {
      const respuesta = await changePassword(
        formPassword.passwordActual,
        formPassword.passwordNueva,
      );
      setExitoPassword(respuesta.mensaje);
      setFormPassword(FORM_PASSWORD_VACIO);
    } catch (err) {
      setErrorPassword(mensajeDeError(err));
    } finally {
      setGuardandoPassword(false);
    }
  }

  return (
    <div className="account-page">
      <header className="account-header">
        <div>
          <h1>Mi cuenta</h1>
          <p className="account-subtitulo">
            Tus datos personales y el estado de la cuenta.
          </p>
        </div>
      </header>

      {error && (
        <div className="account-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void recargar()}>
            Reintentar
          </button>
        </div>
      )}

      {exito && (
        <div className="account-exito" role="status">
          {exito}
        </div>
      )}

      {!usuario ? (
        <p className="account-estado">No pudimos cargar tu cuenta.</p>
      ) : (
        <div className="account-grid">
          <section className="account-card account-perfil">
            <div className="account-perfil-header">
              <div className="account-avatar" aria-hidden="true">
                {obtenerIniciales(usuario.nombre)}
              </div>
              <div className="account-perfil-datos">
                <h2>{usuario.nombre}</h2>
                <p>{etiquetaRol(usuario.rol)}</p>
              </div>
              <button
                type="button"
                className="btn-secundario"
                onClick={abrirEditar}
              >
                <Pencil size={16} />
                Editar datos
              </button>
            </div>

            <div className="account-filas">
              <div className="account-fila">
                <span className="account-fila-label">
                  <Mail size={16} />
                  Email
                </span>
                <span className="account-fila-valor">{usuario.email}</span>
              </div>
              <div className="account-fila">
                <span className="account-fila-label">
                  <Phone size={16} />
                  Teléfono
                </span>
                <span className="account-fila-valor">
                  {usuario.telefono || "Sin teléfono"}
                </span>
              </div>
            </div>
          </section>

          <section className="account-card">
            <h2>Información de la cuenta</h2>
            <div className="account-filas">
              <div className="account-fila">
                <span className="account-fila-label">Rol</span>
                <span className="account-fila-valor">
                  {etiquetaRol(usuario.rol)}
                </span>
              </div>
              <div className="account-fila">
                <span className="account-fila-label">Estado</span>
                <span
                  className={`account-chip ${
                    usuario.activo ? "activa" : "inactiva"
                  }`}
                >
                  {usuario.activo ? "Activa" : "Inactiva"}
                </span>
              </div>
              <div className="account-fila">
                <span className="account-fila-label">Fecha de alta</span>
                <span className="account-fila-valor">
                  {formatearFechaAlta(usuario.createdAt)}
                </span>
              </div>
            </div>
          </section>

          <section className="account-card account-password">
            <h2>Cambiar contraseña</h2>

            {errorPassword && (
              <div className="account-error" role="alert">
                {errorPassword}
              </div>
            )}
            {exitoPassword && (
              <div className="account-exito" role="status">
                {exitoPassword}
              </div>
            )}

            <form onSubmit={(evento) => void guardarPassword(evento)}>
              <label className="campo">
                <span>Contraseña actual</span>
                <input
                  type="password"
                  value={formPassword.passwordActual}
                  onChange={(evento) =>
                    setFormPassword((actual) => ({
                      ...actual,
                      passwordActual: evento.target.value,
                    }))
                  }
                  required
                  autoComplete="current-password"
                />
              </label>

              <label className="campo">
                <span>Contraseña nueva</span>
                <input
                  type="password"
                  minLength={8}
                  value={formPassword.passwordNueva}
                  onChange={(evento) =>
                    setFormPassword((actual) => ({
                      ...actual,
                      passwordNueva: evento.target.value,
                    }))
                  }
                  required
                  autoComplete="new-password"
                />
              </label>

              <label className="campo">
                <span>Repetir contraseña nueva</span>
                <input
                  type="password"
                  minLength={8}
                  value={formPassword.passwordRepetir}
                  onChange={(evento) =>
                    setFormPassword((actual) => ({
                      ...actual,
                      passwordRepetir: evento.target.value,
                    }))
                  }
                  required
                  autoComplete="new-password"
                />
              </label>

              <div className="modal-acciones">
                <button
                  type="submit"
                  className="btn-primario"
                  disabled={guardandoPassword}
                >
                  {guardandoPassword ? "Guardando…" : "Actualizar contraseña"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {modalAbierto && (
        <div
          className="modal-overlay"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) cerrarModal();
          }}
        >
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-cuenta"
          >
            <h2 id="titulo-modal-cuenta">Editar datos</h2>

            <form onSubmit={(evento) => void guardar(evento)}>
              <label className="campo">
                <span>Nombre</span>
                <input
                  type="text"
                  maxLength={100}
                  value={form.nombre}
                  onChange={(evento) =>
                    setForm((actual) => ({
                      ...actual,
                      nombre: evento.target.value,
                    }))
                  }
                  required
                  autoFocus
                />
              </label>

              <label className="campo">
                <span>Email</span>
                <input
                  type="email"
                  maxLength={150}
                  value={form.email}
                  onChange={(evento) =>
                    setForm((actual) => ({
                      ...actual,
                      email: evento.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label className="campo">
                <span>Teléfono</span>
                <input
                  type="tel"
                  maxLength={30}
                  placeholder="Opcional"
                  value={form.telefono}
                  onChange={(evento) =>
                    setForm((actual) => ({
                      ...actual,
                      telefono: evento.target.value,
                    }))
                  }
                />
              </label>

              <div className="modal-acciones">
                <button
                  type="button"
                  className="btn-secundario"
                  onClick={cerrarModal}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primario"
                  disabled={guardando}
                >
                  {guardando ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
