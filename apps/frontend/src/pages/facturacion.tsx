import { useState, type FormEvent } from 'react';
import { serviciosDisponibles, boletasIniciales } from '../data/boletas';
import type { Boleta, TipoServicio } from '../types/boleta';
import { formatearFecha, formatearMonto, fechaDeHoy } from '../utils/formato';
import estilos from './facturacion.module.css';

type Pestana = 'vencimientos' | 'comprobantes';

const nombreBoleta = (tipo: TipoServicio) =>
  'Boleta de ' + serviciosDisponibles[tipo].nombre.toLowerCase();

function Facturacion() {
  const [boletas, setBoletas] = useState<Boleta[]>(boletasIniciales);
  const [tipo, setTipo] = useState<TipoServicio>('luz');
  const [monto, setMonto] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [pestana, setPestana] = useState<Pestana>('vencimientos');

  const marcarComoPagado = (id: number) => {
    setBoletas(
      boletas.map((boleta) =>
        boleta.id === id ? { ...boleta, pagada: true, fechaPago: fechaDeHoy() } : boleta
      )
    );
  };

  const agregarBoleta = (evento: FormEvent) => {
    evento.preventDefault();
    const montoNumero = Number(monto);
    if (montoNumero <= 0 || !fechaVencimiento) return;
    setBoletas([
      ...boletas,
      { id: Date.now(), tipo, fechaVencimiento, monto: montoNumero, pagada: false, fechaPago: '' },
    ]);
    setTipo('luz');
    setMonto('');
    setFechaVencimiento('');
  };

  const boletasPendientes = boletas.filter((boleta) => !boleta.pagada);
  const boletasPagadas = boletas.filter((boleta) => boleta.pagada);
  const totalPendiente = boletasPendientes.reduce((suma, boleta) => suma + boleta.monto, 0);
  const proximosVencimientos = [...boletasPendientes].sort((a, b) =>
    a.fechaVencimiento.localeCompare(b.fechaVencimiento)
  );

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
          {boletas.map((boleta) => {
            const Icono = serviciosDisponibles[boleta.tipo].icono;
            return (
              <div className={estilos.item} key={boleta.id}>
                <div className={estilos.icono}>
                  <Icono size={22} />
                </div>
                <div className={estilos.info}>
                  <p className={estilos.nombre}>{nombreBoleta(boleta.tipo)}</p>
                  <p className={estilos.fecha}>Vence {formatearFecha(boleta.fechaVencimiento)}</p>
                </div>
                <p className={estilos.monto}>{formatearMonto(boleta.monto)}</p>
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
                  onClick={() => marcarComoPagado(boleta.id)}
                >
                  Marcar pagado
                </button>
              </div>
            );
          })}
        </section>

        <section className={estilos.tarjeta}>
          <h2>Cargar boleta</h2>
          <form className={estilos.formulario} onSubmit={agregarBoleta}>
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
              const Icono = serviciosDisponibles[boleta.tipo].icono;
              return (
                <div className={estilos.item} key={boleta.id}>
                  <div className={estilos.icono}>
                    <Icono size={22} />
                  </div>
                  <div className={estilos.info}>
                    <p className={estilos.nombre}>{nombreBoleta(boleta.tipo)}</p>
                    <p className={estilos.fecha}>Vence el {formatearFecha(boleta.fechaVencimiento)}</p>
                  </div>
                  <p className={estilos.monto}>{formatearMonto(boleta.monto)}</p>
                </div>
              );
            })
          ))}

        {pestana === 'comprobantes' &&
          (boletasPagadas.length === 0 ? (
            <p className={estilos.vacio}>Todavía no hay boletas pagadas.</p>
          ) : (
            boletasPagadas.map((boleta) => {
              const Icono = serviciosDisponibles[boleta.tipo].icono;
              return (
                <div className={estilos.item} key={boleta.id}>
                  <div className={estilos.icono}>
                    <Icono size={22} />
                  </div>
                  <div className={estilos.info}>
                    <p className={estilos.nombre}>{nombreBoleta(boleta.tipo)}</p>
                    <p className={estilos.fecha}>Pagada el {formatearFecha(boleta.fechaPago)}</p>
                  </div>
                  <p className={estilos.monto}>{formatearMonto(boleta.monto)}</p>
                </div>
              );
            })
          ))}
      </section>
    </div>
  );
}

export default Facturacion;