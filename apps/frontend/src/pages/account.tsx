import { useCallback, useEffect, useState, type FormEvent } from "react";
import "./account.css";
import { Mail, Pencil, Phone } from "lucide-react";
import { apiGet, apiPatch, ID_USUARIO } from "../services/api";
import type { RolUsuario, Usuario } from "../types/finanzas";

interface FormUsuario {
  nombre: string;
  email: string;
  telefono: string;
}

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
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState<FormUsuario>({
    nombre: "",
    email: "",
    telefono: "",
  });
  const [guardando, setGuardando] = useState(false);

  const cargarUsuario = useCallback(async () => {
    try {
      const datos = await apiGet<Usuario>(`/api/users/${ID_USUARIO}`);
      setUsuario(datos);
      setError(null);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
    }
  }, []);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    await cargarUsuario();
  }, [cargarUsuario]);

  useEffect(() => {
    // El estado se actualiza después de los await, no de forma sincrónica.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargarUsuario();
  }, [cargarUsuario]);

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
      const actualizado = await apiPatch<Usuario>(
        `/api/users/${usuario.id}`,
        {
          nombre: form.nombre.trim(),
          email: form.email.trim().toLowerCase(),
          telefono: form.telefono.trim() || null,
        },
      );
      setUsuario(actualizado);
      setModalAbierto(false);
      setExito("Datos actualizados.");
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setGuardando(false);
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

      {cargando ? (
        <p className="account-estado">Cargando tus datos…</p>
      ) : !usuario ? (
        !error && <p className="account-estado">No pudimos cargar tu cuenta.</p>
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
