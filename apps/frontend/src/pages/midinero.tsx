import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import './midinero.css';
import GraficoTorta from '../components/GraficoTorta';
import SelectorPeriodo from '../components/SelectorPeriodo';
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from '../services/api';
import type { Billetera, ListaPaginada, Transaccion } from '../types/finanzas';
import { formatearFecha } from '../utils/formato';
import { filtrarPorPeriodo } from '../utils/periodo';
import type { PeriodoSeleccionado } from '../utils/periodo';
import {
  agruparEgresosPorBilletera,
  agruparEgresosPorCategoria,
  COLORES_BALANCE,
  construirPorciones,
  PALETA_GRAFICO,
  totalesIngresoEgreso,
} from '../utils/resumenGastos';
import type { DatoGrafico } from '../utils/resumenGastos';

type Filtro = 'todo' | 'ingreso' | 'gasto';
type VistaGrafico = 'categoria' | 'balance' | 'cuenta';

interface FormBilletera {
  nombre: string;
  tipo: string;
}

const TIPOS_BILLETERA = [
  { valor: 'cash', etiqueta: 'Efectivo' },
  { valor: 'bank', etiqueta: 'Cuenta corriente' },
  { valor: 'savings', etiqueta: 'Caja de ahorro' },
  { valor: 'credit', etiqueta: 'Tarjeta de crédito' },
];

function etiquetaTipo(tipo: string): string {
  return TIPOS_BILLETERA.find((t) => t.valor === tipo)?.etiqueta ?? tipo;
}

function formatearMoneda(valor: number): string {
  return '$ ' + valor.toLocaleString('es-AR', { maximumFractionDigits: 2 });
}

function mensajeDeError(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

function MiDinero() {
  const [billeteras, setBilleteras] = useState<Billetera[]>([]);
  const [movimientos, setMovimientos] = useState<Transaccion[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('todo');
  const [vistaGrafico, setVistaGrafico] = useState<VistaGrafico>('categoria');
  const [periodoResumen, setPeriodoResumen] = useState<PeriodoSeleccionado>({
    tipo: 'preset',
    preset: 'mesActual',
  });
  const [periodoMovimientos, setPeriodoMovimientos] =
    useState<PeriodoSeleccionado>({
      tipo: 'preset',
      preset: 'mesActual',
    });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Billetera | null>(null);
  const [form, setForm] = useState<FormBilletera>({ nombre: '', tipo: 'cash' });
  const [guardando, setGuardando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);

  const cargarDatos = useCallback(async () => {
    try {
      const [lista, todasLasTransacciones] = await Promise.all([
        apiGet<ListaPaginada<Billetera>>(
          '/billeteras?limit=100&sortBy=nombre&order=asc',
        ),
        apiGet<Transaccion[]>('/api/transactions'),
      ]);

      const idsBilleteras = new Set(lista.data.map((b) => b.idBilletera));
      setBilleteras(lista.data);
      setMovimientos(
        todasLasTransacciones.filter((t) => idsBilleteras.has(t.idBilletera)),
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
    await cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    // El estado se actualiza después de los await, no de forma sincrónica.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargarDatos();
  }, [cargarDatos]);

  const saldoTotal = billeteras.reduce(
    (acc, billetera) => acc + Number(billetera.saldo),
    0,
  );

  const movimientosPeriodo = useMemo(
    () => filtrarPorPeriodo(movimientos, periodoMovimientos),
    [movimientos, periodoMovimientos],
  );

  const movimientosFiltrados = movimientosPeriodo.filter((movimiento) => {
    if (filtro === 'todo') return true;
    return filtro === 'ingreso'
      ? movimiento.tipo === 'ingreso'
      : movimiento.tipo === 'egreso';
  });

  const movimientosVisibles = movimientosFiltrados.slice(0, 10);

  const transaccionesPeriodo = useMemo(
    () => filtrarPorPeriodo(movimientos, periodoResumen),
    [movimientos, periodoResumen],
  );

  const resumenGrafico = useMemo(() => {
    let datos: DatoGrafico[];
    let colores: readonly string[];
    let vacio: string;

    if (vistaGrafico === 'balance') {
      const { ingresos, egresos } = totalesIngresoEgreso(transaccionesPeriodo);
      datos = [
        { etiqueta: 'Ingresos', monto: ingresos },
        { etiqueta: 'Gastos', monto: egresos },
      ];
      colores = COLORES_BALANCE;
      vacio = 'No hay movimientos en el período.';
    } else {
      datos =
        vistaGrafico === 'categoria'
          ? agruparEgresosPorCategoria(transaccionesPeriodo)
          : agruparEgresosPorBilletera(transaccionesPeriodo, billeteras);
      colores = PALETA_GRAFICO;
      vacio = 'No hay gastos en el período.';
    }

    const porciones = construirPorciones(datos, colores);
    return {
      porciones,
      total: porciones.reduce((acc, porcion) => acc + porcion.monto, 0),
      vacio,
    };
  }, [billeteras, transaccionesPeriodo, vistaGrafico]);

  function abrirCrear() {
    setEditando(null);
    setForm({ nombre: '', tipo: 'cash' });
    setModalAbierto(true);
  }

  function abrirEditar(billetera: Billetera) {
    setEditando(billetera);
    setForm({ nombre: billetera.nombre, tipo: billetera.tipo });
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

    try {
      if (editando) {
        await apiPatch<Billetera>(`/billeteras/${editando.idBilletera}`, form);
      } else {
        // El propietario lo define el backend a partir del token.
        await apiPost<Billetera>('/billeteras', form);
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

  async function eliminar(billetera: Billetera) {
    const confirmado = window.confirm(
      `¿Eliminar "${billetera.nombre}"?\n\nTambién se eliminarán los movimientos asociados a esta cuenta.`,
    );
    if (!confirmado) return;

    setEliminandoId(billetera.idBilletera);
    setError(null);
    try {
      await apiDelete<unknown>(`/billeteras/${billetera.idBilletera}`);
      await recargar();
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEliminandoId(null);
    }
  }

  const tipoDesconocido =
    form.tipo !== '' && !TIPOS_BILLETERA.some((t) => t.valor === form.tipo);

  return (
    <div className="midinero">
      <div className="midinero-header">
        <h1>Mi dinero</h1>
        <button type="button" className="btn-primario" onClick={abrirCrear}>
          + Nueva cuenta
        </button>
      </div>

      <div className="saldo-card">
        <h2>Dinero total</h2>
        <p className="saldo">{formatearMoneda(saldoTotal)}</p>
      </div>

      {error && (
        <div className="midinero-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void recargar()}>
            Reintentar
          </button>
        </div>
      )}

      {cargando ? (
        <p className="midinero-vacio">Cargando datos…</p>
      ) : (
        <>
          <section className="midinero-seccion">
            <h2>Mis cuentas</h2>
            {billeteras.length === 0 ? (
              <p className="midinero-vacio">
                No tenés cuentas todavía. Creá la primera con “Nueva cuenta”.
              </p>
            ) : (
              billeteras.map((billetera) => (
                <div
                  key={billetera.idBilletera}
                  className="midinero-fila midinero-cuenta"
                >
                  <span className="midinero-concepto">
                    <span className="midinero-nombre">{billetera.nombre}</span>
                    <span className="midinero-tipo">
                      {etiquetaTipo(billetera.tipo)}
                    </span>
                  </span>
                  <span className="midinero-monto">
                    {formatearMoneda(Number(billetera.saldo))}
                  </span>
                  <div className="midinero-acciones">
                    <button
                      type="button"
                      className="btn-secundario"
                      onClick={() => abrirEditar(billetera)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn-peligro"
                      disabled={eliminandoId === billetera.idBilletera}
                      onClick={() => void eliminar(billetera)}
                    >
                      {eliminandoId === billetera.idBilletera
                        ? 'Eliminando…'
                        : 'Eliminar'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>

          <section
            className="midinero-seccion midinero-graficos"
            aria-labelledby="titulo-graficos"
          >
            <div className="midinero-seccion-header">
              <h2 id="titulo-graficos">Resumen del período</h2>
              <SelectorPeriodo
                valor={periodoResumen}
                onChange={setPeriodoResumen}
                movimientos={movimientos}
                etiqueta="Período del resumen"
              />
            </div>

            <div
              className="midinero-graficos-tabs"
              role="group"
              aria-label="Tipo de gráfico"
            >
              <button
                type="button"
                className={vistaGrafico === 'categoria' ? 'activo' : ''}
                aria-pressed={vistaGrafico === 'categoria'}
                onClick={() => setVistaGrafico('categoria')}
              >
                Categorías
              </button>
              <button
                type="button"
                className={vistaGrafico === 'balance' ? 'activo' : ''}
                aria-pressed={vistaGrafico === 'balance'}
                onClick={() => setVistaGrafico('balance')}
              >
                Ingresos vs gastos
              </button>
              <button
                type="button"
                className={vistaGrafico === 'cuenta' ? 'activo' : ''}
                aria-pressed={vistaGrafico === 'cuenta'}
                onClick={() => setVistaGrafico('cuenta')}
              >
                Cuentas
              </button>
            </div>

            <GraficoTorta
              porciones={resumenGrafico.porciones}
              total={resumenGrafico.total}
              vacio={resumenGrafico.vacio}
            />
          </section>

          <section className="midinero-seccion">
            <div className="midinero-seccion-header">
              <h2>Movimientos</h2>
              <SelectorPeriodo
                valor={periodoMovimientos}
                onChange={setPeriodoMovimientos}
                movimientos={movimientos}
                etiqueta="Período de movimientos"
              />
            </div>

            <div className="midinero-filtros">
              <button
                type="button"
                className={filtro === 'todo' ? 'activo' : ''}
                onClick={() => setFiltro('todo')}
              >
                Todo
              </button>
              <button
                type="button"
                className={filtro === 'ingreso' ? 'activo' : ''}
                onClick={() => setFiltro('ingreso')}
              >
                Ingresos
              </button>
              <button
                type="button"
                className={filtro === 'gasto' ? 'activo' : ''}
                onClick={() => setFiltro('gasto')}
              >
                Gastos
              </button>
            </div>

            {movimientosFiltrados.length === 0 ? (
              <p className="midinero-vacio">No hay movimientos para mostrar.</p>
            ) : (
              movimientosVisibles.map((movimiento) => {
                const esGasto = movimiento.tipo === 'egreso';
                const tipoVisual = esGasto ? 'gasto' : 'ingreso';
                return (
                  <div key={movimiento.idTransaccion} className="midinero-fila">
                    <span className="midinero-concepto">
                      <span className={`dot ${tipoVisual}`} />
                      {movimiento.descripcion || movimiento.categoria}
                    </span>
                    <span className="midinero-fecha">
                      {formatearFecha(movimiento.fecha)}
                    </span>
                    <span className={tipoVisual}>
                      {esGasto ? '-' : '+'} $
                      {Number(movimiento.monto).toLocaleString('es-AR', {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                );
              })
            )}

            {movimientosFiltrados.length > 10 && (
              <Link className="midinero-ver-todos" to="/transacciones">
                Ver todos los movimientos ({movimientosFiltrados.length})
              </Link>
            )}
          </section>
        </>
      )}

      {modalAbierto && (
        <div className="modal-overlay" role="presentation">
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-billetera"
          >
            <h2 id="titulo-modal-billetera">
              {editando ? 'Editar cuenta' : 'Nueva cuenta'}
            </h2>

            <form onSubmit={(e) => void guardar(e)}>
              <label className="campo">
                <span>Nombre</span>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) =>
                    setForm((actual) => ({ ...actual, nombre: e.target.value }))
                  }
                  maxLength={100}
                  required
                  autoFocus
                />
              </label>

              <label className="campo">
                <span>Tipo</span>
                <select
                  value={form.tipo}
                  onChange={(e) =>
                    setForm((actual) => ({ ...actual, tipo: e.target.value }))
                  }
                  required
                >
                  {tipoDesconocido && (
                    <option value={form.tipo}>{form.tipo}</option>
                  )}
                  {TIPOS_BILLETERA.map((tipo) => (
                    <option key={tipo.valor} value={tipo.valor}>
                      {tipo.etiqueta}
                    </option>
                  ))}
                </select>
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

export default MiDinero;
