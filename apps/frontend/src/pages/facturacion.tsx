import { useState, useEffect, type FormEvent } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '../services/api';
import { serviciosDisponibles } from '../data/boletas';
import type { Boleta, TipoServicio } from '../types/boleta';
import { formatearFecha, formatearMonto, fechaDeHoy } from '../utils/formato';
import estilos from './facturacion.module.css';

type Pestana = 'vencimientos' | 'comprobantes';

const nombreBoleta = (tipo: string) => {
  const servicio = serviciosDisponibles[tipo as TipoServicio];
  return servicio ? 'Boleta de ' + servicio.nombre.toLowerCase() : 'Boleta';
};

function mensajeDeError(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrio un error inesperado';
}

function Facturacion() {
  const [boletas, setBoletas] = useState<Boleta[]>([]);
  const [tipo, setTipo] = useState<TipoServicio>('luz');
  const [monto, setMonto] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [pestana, setPestana] = useState<Pestana>('vencimientos');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarBoletas = async () => {
    try {
      const data = await apiGet<Boleta[]>('/boletas');
      setBoletas(data);
      setError(null);
    } catch (err) {
      setError(mensajeDeError(err) || 'Error al cargar boletas');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    // El estado se actualiza después de los await, no de forma sincrónica.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargarBoletas();
  }, []);

  const marcarComoPagado = async (id: number) => {
    try {
      await apiPatch(`/boletas/${id}`, { pagada: true, fechaPago: fechaDeHoy() });
      await cargarBoletas();
    } catch (err) {
      alert(mensajeDeError(err));
    }
  };

  const eliminarBoleta = async (id: number) => {
    if (!window.confirm('Seguro que queres eliminar esta boleta?')) return;
    try {
      await apiDelete(`/boletas/${id}`);
      await cargarBoletas();
    } catch (err) {
      alert(mensajeDeError(err));
    }
  };

  const agregarBoleta = async (evento: FormEvent) => {
    evento.preventDefault();
    const montoNumero = Number(monto);
    if (montoNumero <= 0 || !fechaVencimiento) return;
    
    try {
      await apiPost('/boletas', {
        tipoServicio: tipo,
        monto: monto,
        fechaVencimiento: fechaVencimiento
      });
      setTipo('luz');
      setMonto('');
      setFechaVencimiento('');
      await cargarBoletas();
    } catch (err) {
      alert(mensajeDeError(err));
    }
  };

  const boletasPendientes = boletas.filter((boleta) => !boleta.pagada);
  const boletasPagadas = boletas.filter((boleta) => boleta.pagada);
  const totalPendiente = boletasPendientes.reduce((suma, boleta) => suma + Number(boleta.monto), 0);
  const proximosVencimientos = [...boletasPendientes].sort((a, b) =>
    a.fechaVencimiento.localeCompare(b.fechaVencimiento)
  );

  if (cargando) return <p className={estilos.vacio}>Cargando boletas...</p>;
  if (error) return <p className={estilos.vacio} style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div className={estilos.pagina}>
      <h1>Facturacion</h1>

      <div className={estilos.resumen}>
        <div className={estilos.tarjetaResumen}>
          <p className={estilos.etiquetaResumen}>Total pendiente</p>
          <p className={estilos.valorResumen}>{formatearMonto(totalPendiente)}</p>
        </div>
        <div className={estilos.tarjetaResumen}>
          <p className={estilos.etiquetaResumen}>Boletas pendientes</p>
          <p className={estilos.valorResumen}>
            {boletasPendientes.length} de {boletas.length}
          </p>
        </div>
      </div>

      <div className={estilos.principal}>
        <section className={estilos.tarjeta}>
          <h2>Boletas</h2>
          {boletas.length === 0 && <p className={estilos.vacio}>No hay boletas registradas.</p>}
          {boletas.map((boleta) => {
            const Icono = serviciosDisponibles[boleta.tipoServicio as TipoServicio]?.icono || serviciosDisponibles['otro'].icono;
            return (
              <div className={estilos.item} key={boleta.idBoleta}>
                <div className={estilos.icono}>
                  <Icono size={22} />
                </div>
                <div className={estilos.info}>
                  <p className={estilos.nombre}>{nombreBoleta(boleta.tipoServicio)}</p>
                  <p className={estilos.fecha}>Vence {formatearFecha(boleta.fechaVencimiento)}</p>
                </div>
                <p className={estilos.monto}>{formatearMonto(Number(boleta.monto))}</p>
                <span
                  className={
                    boleta.pagada
                      ? `${estilos.estado} ${estilos.pagada}`
                      : `${estilos.estado} ${estilos.pendiente}`
                  }
                >
                  {boleta.pagada ? 'Pagada' : 'Pendiente'}
                </span>
                <button
                  className={estilos.botonPagar}
                  disabled={boleta.pagada}
                  onClick={() => void marcarComoPagado(boleta.idBoleta)}
                >
                  Marcar pagado
                </button>
                <button
                  className={estilos.botonPagar}
                  style={{ color: 'red', borderColor: 'red', marginLeft: '8px' }}
                  onClick={() => void eliminarBoleta(boleta.idBoleta)}
                >
                  Eliminar
                </button>
              </div>
            );
          })}
        </section>

        <section className={estilos.tarjeta}>
          <h2>Cargar boleta</h2>
          <form className={estilos.formulario} onSubmit={(e) => void agregarBoleta(e)}>
            <label htmlFor="boleta-tipo">Servicio</label>
            <select
              id="boleta-tipo"
              value={tipo}
              onChange={(evento) => setTipo(evento.target.value as TipoServicio)}
            >
              {(Object.keys(serviciosDisponibles) as TipoServicio[]).map((clave) => (
                <option key={clave} value={clave}>
                  {serviciosDisponibles[clave].nombre}
                </option>
              ))}
            </select>

            <label htmlFor="boleta-monto">Monto</label>
            <input
              id="boleta-monto"
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              value={monto}
              onChange={(evento) => setMonto(evento.target.value)}
            />

            <label htmlFor="boleta-fecha">Vencimiento</label>
            <input
              id="boleta-fecha"
              type="date"
              value={fechaVencimiento}
              onChange={(evento) => setFechaVencimiento(evento.target.value)}
            />

            <button className={estilos.botonAgregar} type="submit">
              Agregar boleta
            </button>
          </form>
        </section>
      </div>

      <section className={estilos.tarjeta}>
        <div className={estilos.pestanas}>
          <button
            className={
              pestana === 'vencimientos'
                ? `${estilos.pestana} ${estilos.pestanaActiva}`
                : estilos.pestana
            }
            onClick={() => setPestana('vencimientos')}
          >
            Vencimientos
          </button>
          <button
            className={
              pestana === 'comprobantes'
                ? `${estilos.pestana} ${estilos.pestanaActiva}`
                : estilos.pestana
            }
            onClick={() => setPestana('comprobantes')}
          >
            Comprobantes
          </button>
        </div>

        {pestana === 'vencimientos' &&
          (proximosVencimientos.length === 0 ? (
            <p className={estilos.vacio}>No hay vencimientos pendientes.</p>
          ) : (
            proximosVencimientos.map((boleta) => {
              const Icono = serviciosDisponibles[boleta.tipoServicio as TipoServicio]?.icono || serviciosDisponibles['otro'].icono;
              return (
                <div className={estilos.item} key={boleta.idBoleta}>
                  <div className={estilos.icono}>
                    <Icono size={22} />
                  </div>
                  <div className={estilos.info}>
                    <p className={estilos.nombre}>{nombreBoleta(boleta.tipoServicio)}</p>
                    <p className={estilos.fecha}>Vence el {formatearFecha(boleta.fechaVencimiento)}</p>
                  </div>
                  <p className={estilos.monto}>{formatearMonto(Number(boleta.monto))}</p>
                </div>
              );
            })
          ))}

        {pestana === 'comprobantes' &&
          (boletasPagadas.length === 0 ? (
            <p className={estilos.vacio}>Todavia no hay boletas pagadas.</p>
          ) : (
            boletasPagadas.map((boleta) => {
              const Icono = serviciosDisponibles[boleta.tipoServicio as TipoServicio]?.icono || serviciosDisponibles['otro'].icono;
              return (
                <div className={estilos.item} key={boleta.idBoleta}>
                  <div className={estilos.icono}>
                    <Icono size={22} />
                  </div>
                  <div className={estilos.info}>
                    <p className={estilos.nombre}>{nombreBoleta(boleta.tipoServicio)}</p>
                    <p className={estilos.fecha}>Pagada el {boleta.fechaPago ? formatearFecha(boleta.fechaPago) : 'N/A'}</p>
                  </div>
                  <p className={estilos.monto}>{formatearMonto(Number(boleta.monto))}</p>
                </div>
              );
            })
          ))}
      </section>
    </div>
  );
}

export default Facturacion;
