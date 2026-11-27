import { useCallback, useEffect, useState } from 'react';
import './inicio.css';
import { apiGet } from '../services/api';
import { useAuth } from '../context/useAuth';
import type {
  Billetera,
  ListaPaginada,
  Transaccion,
} from '../types/finanzas';
import { formatearFecha } from '../utils/formato';

function formatearMoneda(valor: number): string {
  const signo = valor < 0 ? '-$ ' : '$ ';
  return (
    signo +
    Math.abs(valor).toLocaleString('es-AR', { maximumFractionDigits: 2 })
  );
}

function mensajeDeError(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
}

function Inicio() {
  const { usuario } = useAuth();
  const [billeteras, setBilleteras] = useState<Billetera[]>([]);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    try {
      // El backend ya filtra por el usuario autenticado (token JWT).
      const [listaBilleteras, todasLasTransacciones] =
        await Promise.all([
          apiGet<ListaPaginada<Billetera>>(
            '/billeteras?limit=100&sortBy=nombre&order=asc',
          ),
          apiGet<Transaccion[]>('/api/transactions'),
        ]);

      setBilleteras(listaBilleteras.data);
      setTransacciones(todasLasTransacciones);
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

  const ahora = new Date();
  const mesActual = ahora.getMonth() + 1;
  const anioActual = ahora.getFullYear();
  const nombreMes = ahora.toLocaleDateString('es-AR', { month: 'long' });

  const saldoTotal = billeteras.reduce(
    (acc, billetera) => acc + Number(billetera.saldo),
    0,
  );

  const movimientosDelMes = transacciones.filter((transaccion) => {
    const [anio, mes] = transaccion.fecha.split('-').map(Number);
    return anio === anioActual && mes === mesActual;
  });

  const ingresosMes = movimientosDelMes
    .filter((transaccion) => transaccion.tipo === 'ingreso')
    .reduce((acc, transaccion) => acc + Number(transaccion.monto), 0);

  const gastosMes = movimientosDelMes
    .filter((transaccion) => transaccion.tipo === 'egreso')
    .reduce((acc, transaccion) => acc + Number(transaccion.monto), 0);

  const ahorroMes = ingresosMes - gastosMes;

  const ultimosMovimientos = [...transacciones]
    .sort(
      (a, b) =>
        b.fecha.localeCompare(a.fecha) || b.idTransaccion - a.idTransaccion,
    )
    .slice(0, 5);

  const nombreCorto = usuario?.nombre.trim().split(/\s+/)[0] ?? '';

  return (
    <div className="inicio">
      <header className="inicio-header">
        <h1>{usuario ? `Hola, ${nombreCorto}` : 'Inicio'}</h1>
        {usuario && (
          <p className="inicio-subtitulo">Resumen de {nombreMes}</p>
        )}
      </header>

      {error && (
        <div className="inicio-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void recargar()}>
            Reintentar
          </button>
        </div>
      )}

      {cargando ? (
        <p className="inicio-estado" role="status">
          Cargando tu resumen…
        </p>
      ) : usuario ? (
        <>
          <div className="saldo-card">
            <h2>Saldo total</h2>
            <p className="saldo">{formatearMoneda(saldoTotal)}</p>
          </div>

          <div className="inicio-resumen">
            <div className="inicio-card ingreso">
              <h3>Ingresos del mes</h3>
              <p>{formatearMoneda(ingresosMes)}</p>
            </div>
            <div className="inicio-card gasto">
              <h3>Gastos del mes</h3>
              <p>{formatearMoneda(gastosMes)}</p>
            </div>
            <div className="inicio-card ahorro">
              <h3>Ahorro del mes</h3>
              <p>{formatearMoneda(ahorroMes)}</p>
            </div>
          </div>

          <section className="inicio-seccion">
            <h2>Últimos movimientos</h2>
            {ultimosMovimientos.length === 0 ? (
              <p className="inicio-vacio">
                Todavía no tenés movimientos cargados.
              </p>
            ) : (
              ultimosMovimientos.map((movimiento) => {
                const esGasto = movimiento.tipo === 'egreso';
                const tipoVisual = esGasto ? 'gasto' : 'ingreso';
                return (
                  <div key={movimiento.idTransaccion} className="inicio-fila">
                    <span className="inicio-concepto">
                      <span className={`dot ${tipoVisual}`} />
                      {movimiento.descripcion || movimiento.categoria}
                    </span>
                    <span className="inicio-fecha">
                      {formatearFecha(movimiento.fecha)}
                    </span>
                    <span className={`inicio-monto ${tipoVisual}`}>
                      {esGasto ? '-' : '+'}{' '}
                      {formatearMoneda(Number(movimiento.monto))}
                    </span>
                  </div>
                );
              })
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

export default Inicio;
