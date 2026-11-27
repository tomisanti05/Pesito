import { useCallback, useEffect, useState, type FormEvent } from "react";
import "./tarjetas.css";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Pencil,
  Play,
  Trash2,
} from "lucide-react";
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "../services/api";
import type { ListaPaginada, Suscripcion, Tarjeta, TipoTarjeta } from "../types/finanzas";

const TIPOS: { valor: TipoTarjeta; etiqueta: string }[] = [
  { valor: "visa", etiqueta: "Visa" },
  { valor: "mastercard", etiqueta: "Mastercard" },
  { valor: "amex", etiqueta: "American Express" },
  { valor: "otra", etiqueta: "Otra" },
];

interface FormTarjeta {
  tipo: TipoTarjeta;
  ultimosCuatro: string;
  titular: string;
  vencimiento: string;
}

const FORM_VACIO: FormTarjeta = {
  tipo: "visa",
  ultimosCuatro: "",
  titular: "",
  vencimiento: "",
};

function etiquetaTipo(tipo: TipoTarjeta): string {
  return TIPOS.find((item) => item.valor === tipo)?.etiqueta ?? "Otra";
}

function mensajeDeError(error: unknown): string {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

function formatearVencimiento(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 4);
  return digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos;
}

function TarjetaVisual({ tarjeta }: { tarjeta: Tarjeta }) {
  const imagen =
    tarjeta.tipo === "visa" || tarjeta.tipo === "mastercard"
      ? `/img/tarjetas/${tarjeta.tipo}_tarjeta.png`
      : null;

  return (
    <div className={`tarjeta-visual tarjeta-visual-${tarjeta.tipo}`}>
      {imagen ? (
        <img src={imagen} alt="" className="tarjeta-visual-fondo" />
      ) : (
        <div className="tarjeta-visual-generica" aria-hidden="true" />
      )}

      <div className="tarjeta-visual-contenido">
        <span className="tarjeta-visual-marca">{etiquetaTipo(tarjeta.tipo)}</span>
        <div>
          <span className="tarjeta-visual-numero">
            •••• •••• •••• {tarjeta.ultimosCuatro}
          </span>
          <span className="tarjeta-visual-titular">{tarjeta.titular}</span>
        </div>
      </div>
    </div>
  );
}

export default function Tarjetas() {
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
  const [indice, setIndice] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Tarjeta | null>(null);
  const [form, setForm] = useState<FormTarjeta>(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [pausandoId, setPausandoId] = useState<number | null>(null);
  const [tarjetaAEliminar, setTarjetaAEliminar] = useState<Tarjeta | null>(null);
  const [borrando, setBorrando] = useState(false);

  const cargarTarjetas = useCallback(async () => {
    try {
      // Ambos listados vienen filtrados por el usuario autenticado (token JWT).
      const [lista, suscripcionesApi] = await Promise.all([
        apiGet<ListaPaginada<Tarjeta>>(`/tarjetas?limit=100&sortBy=id&order=desc`),
        apiGet<ListaPaginada<Suscripcion>>(`/suscripciones?limit=100&sortBy=id&order=desc`),
      ]);
      setTarjetas(lista.data);
      setSuscripciones(suscripcionesApi.data);
      setIndice((actual) =>
        lista.data.length === 0 ? 0 : Math.min(actual, lista.data.length - 1),
      );
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
    await cargarTarjetas();
  }, [cargarTarjetas]);

  useEffect(() => {
    // El estado se actualiza después de los await, no de forma sincrónica.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargarTarjetas();
  }, [cargarTarjetas]);

  useEffect(() => {
    if (!modalAbierto && !tarjetaAEliminar) return;

    const alPresionarTecla = (evento: KeyboardEvent) => {
      if (evento.key !== "Escape" || guardando || borrando) return;
      setModalAbierto(false);
      setEditando(null);
      setTarjetaAEliminar(null);
    };

    window.addEventListener("keydown", alPresionarTecla);
    return () => window.removeEventListener("keydown", alPresionarTecla);
  }, [modalAbierto, tarjetaAEliminar, guardando, borrando]);

  const tarjetaActual = tarjetas[indice] ?? null;
  // Historial de la tarjeta: las suscripciones que le cobran a esta tarjeta.
  const suscripcionesTarjeta = tarjetaActual
    ? suscripciones.filter((s) => s.idTarjeta === tarjetaActual.id)
    : [];
  const gastoMensualTarjeta = suscripcionesTarjeta
    .filter((s) => s.activa)
    .reduce((total, s) => total + Number(s.monto), 0);

  function irAnterior() {
    if (tarjetas.length <= 1) return;
    setIndice((actual) =>
      actual === 0 ? tarjetas.length - 1 : actual - 1,
    );
  }

  function irSiguiente() {
    if (tarjetas.length <= 1) return;
    setIndice((actual) =>
      actual === tarjetas.length - 1 ? 0 : actual + 1,
    );
  }

  function abrirCrear() {
    setEditando(null);
    setForm(FORM_VACIO);
    setModalAbierto(true);
  }

  function abrirEditar(tarjeta: Tarjeta) {
    setEditando(tarjeta);
    setForm({
      tipo: tarjeta.tipo,
      ultimosCuatro: tarjeta.ultimosCuatro,
      titular: tarjeta.titular,
      vencimiento: tarjeta.vencimiento,
    });
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (guardando) return;
    setModalAbierto(false);
    setEditando(null);
  }

  function cerrarConfirmacion() {
    if (borrando) return;
    setTarjetaAEliminar(null);
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    setError(null);

    const datos = {
      tipo: form.tipo,
      ultimosCuatro: form.ultimosCuatro.trim(),
      titular: form.titular.trim(),
      vencimiento: form.vencimiento.trim(),
    };

    if (!/^\d{4}$/.test(datos.ultimosCuatro)) {
      setError("Ingresá los últimos 4 dígitos de la tarjeta.");
      return;
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(datos.vencimiento)) {
      setError("El vencimiento debe tener el formato MM/YY.");
      return;
    }

    setGuardando(true);
    try {
      if (editando) {
        await apiPatch<Tarjeta>(`/tarjetas/${editando.id}`, datos);
      } else {
        // El propietario lo define el backend a partir del token.
        await apiPost<Tarjeta>("/tarjetas", datos);
        setIndice(0);
      }
      setModalAbierto(false);
      setEditando(null);
      await recargar();
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  }

  async function alternarActiva(tarjeta: Tarjeta) {
    setPausandoId(tarjeta.id);
    setError(null);
    try {
      const actualizada = await apiPatch<Tarjeta>(`/tarjetas/${tarjeta.id}`, {
        activa: !tarjeta.activa,
      });
      setTarjetas((actuales) =>
        actuales.map((item) =>
          item.id === actualizada.id ? actualizada : item,
        ),
      );
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setPausandoId(null);
    }
  }

  async function confirmarEliminar() {
    if (!tarjetaAEliminar) return;

    setBorrando(true);
    setError(null);
    try {
      await apiDelete<unknown>(`/tarjetas/${tarjetaAEliminar.id}`);
      setTarjetaAEliminar(null);
      await recargar();
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setBorrando(false);
    }
  }

  return (
    <div className="tarjetas-page">
      <header className="tarjetas-header">
        <div>
          <h1>Mis tarjetas</h1>
          <p className="tarjetas-subtitulo">
            Administrá las tarjetas con las que operás.
          </p>
        </div>
        <button type="button" className="btn-primario" onClick={abrirCrear}>
          + Agregar tarjeta
        </button>
      </header>

      {error && (
        <div className="tarjetas-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void recargar()}>
            Reintentar
          </button>
        </div>
      )}

      {cargando ? (
        <p className="tarjetas-estado">Cargando tarjetas…</p>
      ) : tarjetas.length === 0 || !tarjetaActual ? (
        <div className="tarjetas-vacio">
          <h2>No tenés tarjetas guardadas</h2>
          <p>Agregá la primera para identificarla en tus suscripciones y movimientos.</p>
          <button type="button" className="btn-primario" onClick={abrirCrear}>
            + Agregar tarjeta
          </button>
        </div>
      ) : (
        <div className="tarjetas-grid">
          <section className="tarjetas-panel" aria-label="Tarjeta seleccionada">
            <TarjetaVisual tarjeta={tarjetaActual} />

            {tarjetas.length > 1 && (
              <div className="tarjetas-controles">
                <button
                  type="button"
                  className="tarjetas-flecha"
                  onClick={irAnterior}
                  aria-label="Tarjeta anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="tarjetas-contador">
                  {indice + 1} de {tarjetas.length}
                </span>
                <button
                  type="button"
                  className="tarjetas-flecha"
                  onClick={irSiguiente}
                  aria-label="Tarjeta siguiente"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}

            <div className="tarjetas-datos">
              <div className="tarjetas-fila">
                <span>Número</span>
                <strong>•••• •••• •••• {tarjetaActual.ultimosCuatro}</strong>
              </div>
              <div className="tarjetas-fila">
                <span>Titular</span>
                <strong>{tarjetaActual.titular}</strong>
              </div>
              <div className="tarjetas-fila">
                <span>Vencimiento</span>
                <strong>{tarjetaActual.vencimiento}</strong>
              </div>
              <div className="tarjetas-fila">
                <span>Estado</span>
                <span
                  className={`tarjetas-chip ${
                    tarjetaActual.activa ? "activa" : "pausada"
                  }`}
                >
                  {tarjetaActual.activa ? "Activa" : "Pausada"}
                </span>
              </div>
            </div>

            <div className="tarjetas-acciones">
              <button
                type="button"
                className="btn-secundario"
                onClick={() => abrirEditar(tarjetaActual)}
              >
                <Pencil size={16} />
                Editar
              </button>
              <button
                type="button"
                className="btn-secundario"
                disabled={pausandoId === tarjetaActual.id}
                onClick={() => void alternarActiva(tarjetaActual)}
              >
                {tarjetaActual.activa ? <Pause size={16} /> : <Play size={16} />}
                {pausandoId === tarjetaActual.id
                  ? "Guardando…"
                  : tarjetaActual.activa
                    ? "Pausar"
                    : "Reactivar"}
              </button>
              <button
                type="button"
                className="btn-peligro"
                onClick={() => setTarjetaAEliminar(tarjetaActual)}
              >
                <Trash2 size={16} />
                Eliminar
              </button>
            </div>
          </section>

          <aside className="tarjetas-panel tarjetas-historial">
            <h2>Historial</h2>

            {suscripcionesTarjeta.length === 0 ? (
              <p className="tarjetas-historial-vacio">
                Esta tarjeta no tiene suscripciones asociadas todavía. Creá una
                suscripción y asignale esta tarjeta para ver sus cargos acá.
              </p>
            ) : (
              <>
                <ul className="tarjetas-historial-lista">
                  {suscripcionesTarjeta.map((s) => (
                    <li key={s.idSuscripcion} className="tarjetas-historial-item">
                      <div className="tarjetas-historial-info">
                        <span className="tarjetas-historial-proveedor">
                          {s.proveedor}
                        </span>
                        <span className="tarjetas-historial-detalle">
                          {s.plan} · cobra el día {s.diaCobro}
                          {s.activa ? "" : " · pausada"}
                        </span>
                      </div>
                      <span className="tarjetas-historial-monto">
                        ${Number(s.monto).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="tarjetas-historial-total">
                  <span>Gasto mensual de esta tarjeta</span>
                  <strong>
                    ${gastoMensualTarjeta.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </>
            )}
          </aside>
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
            aria-labelledby="titulo-modal-tarjeta"
          >
            <h2 id="titulo-modal-tarjeta">
              {editando ? "Editar tarjeta" : "Agregar tarjeta"}
            </h2>

            <form onSubmit={(evento) => void guardar(evento)}>
              <label className="campo">
                <span>Tipo</span>
                <select
                  value={form.tipo}
                  onChange={(evento) =>
                    setForm((actual) => ({
                      ...actual,
                      tipo: evento.target.value as TipoTarjeta,
                    }))
                  }
                  autoFocus
                >
                  {TIPOS.map((tipo) => (
                    <option key={tipo.valor} value={tipo.valor}>
                      {tipo.etiqueta}
                    </option>
                  ))}
                </select>
              </label>

              <label className="campo">
                <span>Últimos 4 dígitos</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  placeholder="1234"
                  value={form.ultimosCuatro}
                  onChange={(evento) =>
                    setForm((actual) => ({
                      ...actual,
                      ultimosCuatro: evento.target.value
                        .replace(/\D/g, "")
                        .slice(0, 4),
                    }))
                  }
                  required
                />
              </label>

              <label className="campo">
                <span>Titular</span>
                <input
                  type="text"
                  maxLength={100}
                  placeholder="Como figura en la tarjeta"
                  value={form.titular}
                  onChange={(evento) =>
                    setForm((actual) => ({
                      ...actual,
                      titular: evento.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label className="campo">
                <span>Vencimiento</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="MM/YY"
                  maxLength={5}
                  pattern="(0[1-9]|1[0-2])/[0-9]{2}"
                  value={form.vencimiento}
                  onChange={(evento) =>
                    setForm((actual) => ({
                      ...actual,
                      vencimiento: formatearVencimiento(evento.target.value),
                    }))
                  }
                  required
                />
              </label>

              <p className="tarjetas-ayuda">
                Solo guardamos los últimos 4 dígitos. No pedimos el número
                completo ni el código de seguridad.
              </p>

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

      {tarjetaAEliminar && (
        <div
          className="modal-overlay"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) cerrarConfirmacion();
          }}
        >
          <div
            className="modal-card modal-card-chico"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-eliminar-tarjeta"
          >
            <h2 id="titulo-eliminar-tarjeta">Eliminar tarjeta</h2>
            <p className="tarjetas-confirmar-texto">
              ¿Querés eliminar la tarjeta terminada en{" "}
              {tarjetaAEliminar.ultimosCuatro}? Esta acción no se puede
              deshacer.
            </p>
            <div className="modal-acciones">
              <button
                type="button"
                className="btn-secundario"
                onClick={cerrarConfirmacion}
                disabled={borrando}
                autoFocus
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-peligro"
                onClick={() => void confirmarEliminar()}
                disabled={borrando}
              >
                {borrando ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
