import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost } from '../services/api';
import type { Billetera, ListaPaginada, Transaccion } from '../types/finanzas';
import { formatearFecha, formatearMonto } from '../utils/formato';
import estilos from './transacciones.module.css';

const POR_PAGINA = 10;

interface Formulario {
  idBilletera: string;
  tipo: 'ingreso' | 'egreso';
  monto: string;
  categoria: string;
  fecha: string;
  descripcion: string;
}

function hoy(): string {
  return new Date().toLocaleDateString('en-CA');
}

function formularioVacio(idBilletera: number | undefined): Formulario {
  return {
    idBilletera: idBilletera ? String(idBilletera) : '',
    tipo: 'egreso',
    monto: '',
    categoria: '',
    fecha: hoy(),
    descripcion: '',
  };
}

function mensajeDeError(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrio un error inesperado';
}

function Transacciones() {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [billeteras, setBilleteras] = useState<Billetera[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Transaccion | null>(null);
  const [form, setForm] = useState<Formulario>(formularioVacio(undefined));
  const [guardando, setGuardando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [lista, movimientos] = await Promise.all([
        apiGet<ListaPaginada<Billetera>>(
          '/billeteras?limit=100&sortBy=nombre&order=asc',
        ),
        apiGet<Transaccion[]>('/api/transactions'),
      ]);
      const ids = new Set(lista.data.map((b) => b.idBilletera));
      setBilleteras(lista.data);
      setTransacciones(movimientos.filter((t) => ids.has(t.idBilletera)));
      setError(null);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    // El estado se actualiza después de los await, no de forma sincrónica.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar();
  }, [cargar]);

  const nombres = new Map(billeteras.map((b) => [b.idBilletera, b.nombre]));
  const texto = busqueda.trim().toLowerCase();
  const filtradas = transacciones.filter((t) => {
    if (!texto) return true;
    const cuenta = nombres.get(t.idBilletera) ?? '';
    return [t.categoria, t.descripcion ?? '', cuenta, t.monto].some((campo) =>
      campo.toLowerCase().includes(texto),
    );
  });
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtradas.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA,
  );

  function abrirCrear() {
    setError(null);
    setEditando(null);
    setForm(formularioVacio(billeteras[0]?.idBilletera));
    setModalAbierto(true);
  }

  function abrirEditar(t: Transaccion) {
    setError(null);
    setEditando(t);
    setForm({
      idBilletera: String(t.idBilletera),
      tipo: t.tipo,
      monto: t.monto,
      categoria: t.categoria,
      fecha: t.fecha,
      descripcion: t.descripcion ?? '',
    });
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (guardando) return;
    setModalAbierto(false);
    setEditando(null);
    setError(null);
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    setGuardando(true);
    setError(null);
    const datos = {
      tipo: form.tipo,
      monto: form.monto,
      categoria: form.categoria.trim(),
      fecha: form.fecha,
      descripcion: form.descripcion.trim(),
    };
    try {
      if (editando) {
        await apiPatch<Transaccion>(
          `/api/transactions/${editando.idTransaccion}`,
          datos,
        );
      } else {
        await apiPost<Transaccion>('/api/transactions', {
          ...datos,
          idBilletera: Number(form.idBilletera),
        });
      }
      setModalAbierto(false);
      setEditando(null);
      await cargar();
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(t: Transaccion) {
    const confirmado = window.confirm(
      'Eliminar este movimiento?\n\nSe revierte su efecto en el saldo de la cuenta.',
    );
    if (!confirmado) return;
    setEliminandoId(t.idTransaccion);
    setError(null);
    try {
      await apiDelete<unknown>(`/api/transactions/${t.idTransaccion}`);
      await cargar();
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setEliminandoId(null);
    }
  }

  return (
    <div className={estilos.pagina}>
      <div className={estilos.cabecera}>
        <h1>Transacciones</h1>
        <button
          type="button"
          className={estilos.primario}
          disabled={billeteras.length === 0}
          onClick={abrirCrear}
        >
          Nuevo movimiento
        </button>
      </div>

      <input
        className={estilos.buscador}
        type="search"
        placeholder="Buscar por categoria, descripcion, cuenta o monto"
        value={busqueda}
        onChange={(e) => {
          setBusqueda(e.target.value);
          setPagina(1);
        }}
      />

      {error && !modalAbierto && (
        <div className={estilos.error} role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void cargar()}>
            Reintentar
          </button>
        </div>
      )}

      {cargando ? (
        <p className={estilos.vacio}>Cargando datos...</p>
      ) : (
        <>
          <p className={estilos.contador}>
            Mostrando {visibles.length} de {filtradas.length} movimientos
          </p>

          {visibles.length === 0 ? (
            <p className={estilos.vacio}>No hay movimientos para mostrar.</p>
          ) : (
            visibles.map((t) => {
              const esEgreso = t.tipo === 'egreso';
              return (
                <div className={estilos.fila} key={t.idTransaccion}>
                  <div className={estilos.detalle}>
                    <p className={estilos.titulo}>{t.descripcion || t.categoria}</p>
                    <p className={estilos.subtitulo}>
                      {t.categoria}, {nombres.get(t.idBilletera) ?? 'Cuenta'},{' '}
                      {formatearFecha(t.fecha)}
                    </p>
                  </div>
                  <p className={esEgreso ? estilos.egreso : estilos.ingreso}>
                    {esEgreso ? '-' : '+'} {formatearMonto(Number(t.monto))}
                  </p>
                  <div className={estilos.acciones}>
                    <button
                      type="button"
                      className={estilos.secundario}
                      onClick={() => abrirEditar(t)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className={estilos.peligro}
                      disabled={eliminandoId === t.idTransaccion}
                      onClick={() => void eliminar(t)}
                    >
                      {eliminandoId === t.idTransaccion ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                </div>
              );
            })
          )}

          <div className={estilos.paginacion}>
            <button
              type="button"
              className={estilos.secundario}
              disabled={paginaActual <= 1}
              onClick={() => setPagina(paginaActual - 1)}
            >
              Anterior
            </button>
            <span>
              Pagina {paginaActual} de {totalPaginas}
            </span>
            <button
              type="button"
              className={estilos.secundario}
              disabled={paginaActual >= totalPaginas}
              onClick={() => setPagina(paginaActual + 1)}
            >
              Siguiente
            </button>
          </div>
        </>
      )}

      {modalAbierto && (
        <div className={estilos.fondo} role="presentation">
          <div
            className={estilos.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-transaccion"
          >
            <h2 id="titulo-modal-transaccion">
              {editando ? 'Editar movimiento' : 'Nuevo movimiento'}
            </h2>

            <form onSubmit={(e) => void guardar(e)}>
              <label className={estilos.campo}>
                <span>Cuenta</span>
                <select
                  value={form.idBilletera}
                  disabled={editando !== null}
                  onChange={(e) => setForm({ ...form, idBilletera: e.target.value })}
                  required
                >
                  {billeteras.map((b) => (
                    <option key={b.idBilletera} value={b.idBilletera}>
                      {b.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label className={estilos.campo}>
                <span>Tipo</span>
                <select
                  value={form.tipo}
                  onChange={(e) =>
                    setForm({ ...form, tipo: e.target.value as Formulario['tipo'] })
                  }
                >
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                </select>
              </label>

              <label className={estilos.campo}>
                <span>Monto</span>
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]+([.][0-9]{1,2})?"
                  title="Numero positivo con hasta dos decimales, con punto"
                  value={form.monto}
                  onChange={(e) => setForm({ ...form, monto: e.target.value })}
                  required
                />
              </label>

              <label className={estilos.campo}>
                <span>Categoria</span>
                <input
                  type="text"
                  maxLength={100}
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                  required
                />
              </label>

              <label className={estilos.campo}>
                <span>Fecha</span>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  required
                />
              </label>

              <label className={estilos.campo}>
                <span>Descripcion</span>
                <input
                  type="text"
                  maxLength={255}
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                />
              </label>

              {error && (
                <p className={estilos.errorModal} role="alert">
                  {error}
                </p>
              )}

              <div className={estilos.botones}>
                <button
                  type="button"
                  className={estilos.secundario}
                  onClick={cerrarModal}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button type="submit" className={estilos.primario} disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transacciones;
