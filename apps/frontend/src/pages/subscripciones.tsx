import { useCallback, useEffect, useState, type FormEvent } from 'react';
import './subscripciones.css';
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from '../services/api';
import type { ListaPaginada, Suscripcion } from '../types/finanzas';

const LIMITE = 5;

interface FormSuscripcion {
  proveedor: string;
  plan: string;
  monto: string;
  diaCobro: string;
  activa: boolean;
}

const FORM_VACIO: FormSuscripcion = {
  proveedor: '',
  plan: '',
  monto: '',
  diaCobro: '1',
  activa: true,
};

function formatearMoneda(valor: number): string {
  return '$ ' + valor.toLocaleString('es-AR', { maximumFractionDigits: 2 });
}

function mensajeDeError(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

function fechaProximoCobro(diaCobro: number, desde = new Date()): Date {
  let anio = desde.getFullYear();
  let mes = desde.getMonth();

  const ultimoDiaDelMes = (a: number, m: number) =>
    new Date(a, m + 1, 0).getDate();

  let dia = Math.min(diaCobro, ultimoDiaDelMes(anio, mes));
  if (dia < desde.getDate()) {
    mes += 1;
    if (mes > 11) {
      mes = 0;
      anio += 1;
    }
    dia = Math.min(diaCobro, ultimoDiaDelMes(anio, mes));
  }

  return new Date(anio, mes, dia);
}

function formatearDiaMes(fecha: Date): string {
  return fecha.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
  });
}

function calcularProximoCobro(suscripciones: Suscripcion[]) {
  const activas = suscripciones.filter((s) => s.activa);
  if (activas.length === 0) return null;

  return activas.reduce<{ suscripcion: Suscripcion; fecha: Date } | null>(
    (mejor, suscripcion) => {
      const fecha = fechaProximoCobro(suscripcion.diaCobro);
      if (!mejor || fecha.getTime() < mejor.fecha.getTime()) {
        return { suscripcion, fecha };
      }
      return mejor;
    },
    null,
  );
}

export default function Subscripciones() {
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
  const [activas, setActivas] = useState<Suscripcion[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Suscripcion | null>(null);
  const [form, setForm] = useState<FormSuscripcion>(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);

  useEffect(() => {
    const temporizador = window.setTimeout(() => {
      setCargando(true);
      setBusquedaAplicada(busqueda.trim());
      setPagina(1);
    }, 300);
    return () => window.clearTimeout(temporizador);
  }, [busqueda]);

  const cargarSuscripciones = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(pagina),
        limit: String(LIMITE),
        sortBy: 'proveedor',
        order: 'asc',
      });
      if (busquedaAplicada) params.set('search', busquedaAplicada);

      const paramsActivas = new URLSearchParams({
        limit: '100',
        sortBy: 'proveedor',
        order: 'asc',
        activa: 'true',
      });

      const [lista, resumen] = await Promise.all([
        apiGet<ListaPaginada<Suscripcion>>(
          `/suscripciones?${params.toString()}`,
        ),
        apiGet<ListaPaginada<Suscripcion>>(
          `/suscripciones?${paramsActivas.toString()}`,
        ),
      ]);

      const maxPaginas = Math.max(1, Math.ceil(lista.total / LIMITE));
      if (pagina > maxPaginas) {
        setPagina(maxPaginas);
        return;
      }

      setSuscripciones(lista.data);
      setTotal(lista.total);
      setActivas(resumen.data);
      setError(null);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
    }
  }, [pagina, busquedaAplicada]);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    await cargarSuscripciones();
  }, [cargarSuscripciones]);

  useEffect(() => {
    // El estado se actualiza después de los await, no de forma sincrónica.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargarSuscripciones();
  }, [cargarSuscripciones]);

  const totalPaginas = Math.max(1, Math.ceil(total / LIMITE));

  const totalMensual = activas.reduce(
    (acc, suscripcion) => acc + Number(suscripcion.monto),
    0,
  );
  const proximo = calcularProximoCobro(activas);

  function abrirCrear() {
    setEditando(null);
    setForm(FORM_VACIO);
    setModalAbierto(true);
  }

  function abrirEditar(suscripcion: Suscripcion) {
    setEditando(suscripcion);
    setForm({
      proveedor: suscripcion.proveedor,
      plan: suscripcion.plan,
      monto: suscripcion.monto,
      diaCobro: String(suscripcion.diaCobro),
      activa: suscripcion.activa,
    });
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (guardando) return;
    setModalAbierto(false);
    setEditando(null);
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    setGuardando(true);
    setError(null);

    const datos = {
      proveedor: form.proveedor.trim(),
      plan: form.plan.trim(),
      monto: form.monto.trim(),
      diaCobro: Number(form.diaCobro),
      activa: form.activa,
    };

    try {
      if (editando) {
        await apiPatch<Suscripcion>(
          `/suscripciones/${editando.idSuscripcion}`,
          datos,
        );
        setModalAbierto(false);
        setEditando(null);
        await recargar();
      } else {
        // El propietario lo define el backend a partir del token.
        await apiPost<Suscripcion>('/suscripciones', {
          idTarjeta: null,
          ...datos,
        });
        setModalAbierto(false);
        if (pagina !== 1) {
          setCargando(true);
          setPagina(1);
        } else {
          await recargar();
        }
      }
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(suscripcion: Suscripcion) {
    const confirmado = window.confirm(
      `¿Eliminar la suscripción a "${suscripcion.proveedor}"?`,
    );
    if (!confirmado) return;

    setEliminandoId(suscripcion.idSuscripcion);
    setError(null);
    try {
      await apiDelete<unknown>(
        `/suscripciones/${suscripcion.idSuscripcion}`,
      );
      await recargar();
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEliminandoId(null);
    }
  }

  return (
    <div className="subscripciones-body">
      <div className="subscripciones-header">
        <h1>Mis Subscripciones</h1>
        <button type="button" className="btn-primario" onClick={abrirCrear}>
          + Añadir suscripción
        </button>
      </div>

      <div className="metricas">
        <span className="gasto-total">
          Total mensual {formatearMoneda(totalMensual)}
        </span>
        <span className="proximo-cobro">
          {proximo
            ? `Próximo: ${proximo.suscripcion.proveedor} · ${formatearDiaMes(proximo.fecha)}`
            : 'Sin cobros próximos'}
        </span>
      </div>

      <div className="subscripciones-buscador">
        <input
          type="search"
          placeholder="Buscar por proveedor o plan…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <span className="subscripciones-contador">
          {total} {total === 1 ? 'suscripción' : 'suscripciones'}
        </span>
      </div>

      {error && (
        <div className="subscripciones-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void recargar()}>
            Reintentar
          </button>
        </div>
      )}

      {cargando ? (
        <p className="subscripciones-vacio">Cargando suscripciones…</p>
      ) : suscripciones.length === 0 ? (
        <p className="subscripciones-vacio">
          {busquedaAplicada
            ? 'No hay suscripciones que coincidan con la búsqueda.'
            : 'Todavía no tenés suscripciones cargadas.'}
        </p>
      ) : (
        <div className="subscripciones">
          {suscripciones.map((suscripcion) => (
            <div
              key={suscripcion.idSuscripcion}
              className={`subscripcion-card${suscripcion.activa ? '' : ' inactiva'}`}
            >
              <span className="proveedor">{suscripcion.proveedor}</span>
              <span className="plan-nombre">
                {suscripcion.plan}
                {!suscripcion.activa && (
                  <em className="estado-inactiva">Inactiva</em>
                )}
              </span>
              <span className="tarjeta-info">
                {suscripcion.idTarjeta
                  ? `Tarjeta #${suscripcion.idTarjeta}`
                  : 'Sin tarjeta'}
              </span>
              <span className="dia-cobro">Día {suscripcion.diaCobro}</span>
              <span className="monto">
                {formatearMoneda(Number(suscripcion.monto))}
              </span>
              <div className="subscripcion-acciones">
                <button
                  type="button"
                  className="btn-secundario"
                  onClick={() => abrirEditar(suscripcion)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="btn-peligro"
                  disabled={eliminandoId === suscripcion.idSuscripcion}
                  onClick={() => void eliminar(suscripcion)}
                >
                  {eliminandoId === suscripcion.idSuscripcion
                    ? 'Eliminando…'
                    : 'Eliminar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="paginacion">
        <button
          type="button"
          className="btn-secundario"
          disabled={pagina <= 1 || cargando}
          onClick={() => {
            setCargando(true);
            setPagina((actual) => Math.max(1, actual - 1));
          }}
        >
          Anterior
        </button>
        <span>
          Página {pagina} de {totalPaginas}
        </span>
        <button
          type="button"
          className="btn-secundario"
          disabled={pagina >= totalPaginas || cargando}
          onClick={() => {
            setCargando(true);
            setPagina((actual) => Math.min(totalPaginas, actual + 1));
          }}
        >
          Siguiente
        </button>
      </div>

      {modalAbierto && (
        <div className="modal-overlay" role="presentation">
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-suscripcion"
          >
            <h2 id="titulo-modal-suscripcion">
              {editando ? 'Editar suscripción' : 'Nueva suscripción'}
            </h2>

            <form onSubmit={(e) => void guardar(e)}>
              <label className="campo">
                <span>Proveedor</span>
                <input
                  type="text"
                  value={form.proveedor}
                  onChange={(e) =>
                    setForm((actual) => ({
                      ...actual,
                      proveedor: e.target.value,
                    }))
                  }
                  maxLength={100}
                  required
                  autoFocus
                />
              </label>

              <label className="campo">
                <span>Plan</span>
                <input
                  type="text"
                  value={form.plan}
                  onChange={(e) =>
                    setForm((actual) => ({ ...actual, plan: e.target.value }))
                  }
                  maxLength={100}
                  required
                />
              </label>

              <label className="campo">
                <span>Monto mensual</span>
                <input
                  type="number"
                  value={form.monto}
                  onChange={(e) =>
                    setForm((actual) => ({ ...actual, monto: e.target.value }))
                  }
                  min="0.01"
                  step="0.01"
                  required
                />
              </label>

              <label className="campo">
                <span>Día de cobro (1 a 31)</span>
                <input
                  type="number"
                  value={form.diaCobro}
                  onChange={(e) =>
                    setForm((actual) => ({
                      ...actual,
                      diaCobro: e.target.value,
                    }))
                  }
                  min="1"
                  max="31"
                  step="1"
                  required
                />
              </label>

              <label className="campo-checkbox">
                <input
                  type="checkbox"
                  checked={form.activa}
                  onChange={(e) =>
                    setForm((actual) => ({
                      ...actual,
                      activa: e.target.checked,
                    }))
                  }
                />
                <span>Activa</span>
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
                  {guardando ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
