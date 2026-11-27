import { useEffect, useState } from 'react';
import { apiGet } from '../services/api';
import type { ListaPaginada, Suscripcion } from '../types/finanzas';
import type { Boleta } from '../types/boleta';
import { formatearMonto } from '../utils/formato';
import estilos from './calendario.module.css';

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Setiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
const DIAS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
const VISIBLES_POR_DIA = 2;

interface Evento {
  clave: string;
  tipo: 'boleta' | 'boletaPagada' | 'suscripcion';
  titulo: string;
  monto: number;
}

function mensajeDeError(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrio un error inesperado';
}

function diasDelMes(anio: number, mes: number): number {
  return new Date(anio, mes + 1, 0).getDate();
}

function armarEventos(
  anio: number,
  mes: number,
  boletas: Boleta[],
  suscripciones: Suscripcion[],
): Map<number, Evento[]> {
  const porDia = new Map<number, Evento[]>();
  const ultimo = diasDelMes(anio, mes);
  const prefijo = `${anio}-${String(mes + 1).padStart(2, '0')}`;

  function agregar(dia: number, evento: Evento) {
    const lista = porDia.get(dia) ?? [];
    lista.push(evento);
    porDia.set(dia, lista);
  }

  boletas.forEach((b) => {
    if (b.fechaVencimiento.slice(0, 7) !== prefijo) return;
    agregar(Number(b.fechaVencimiento.slice(8, 10)), {
      clave: `boleta-${b.idBoleta}`,
      tipo: b.pagada ? 'boletaPagada' : 'boleta',
      titulo: `Boleta de ${b.tipoServicio}`,
      monto: Number(b.monto),
    });
  });

  suscripciones.forEach((s) => {
    if (!s.activa) return;
    agregar(Math.min(s.diaCobro, ultimo), {
      clave: `suscripcion-${s.idSuscripcion}`,
      tipo: 'suscripcion',
      titulo: s.plan.toLowerCase().startsWith(s.proveedor.toLowerCase()) ? s.plan : `${s.proveedor} ${s.plan}`,
      monto: Number(s.monto),
    });
  });

  return porDia;
}

function claseEvento(tipo: Evento['tipo']): string {
  if (tipo === 'boleta') return estilos.boleta;
  if (tipo === 'boletaPagada') return estilos.boletaPagada;
  return estilos.suscripcion;
}

function Calendario() {
  const hoy = new Date();
  const [periodo, setPeriodo] = useState({
    anio: hoy.getFullYear(),
    mes: hoy.getMonth(),
  });
  const [boletas, setBoletas] = useState<Boleta[]>([]);
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiGet<Boleta[]>('/boletas'),
      apiGet<ListaPaginada<Suscripcion>>('/suscripciones?limit=100'),
    ])
      .then(([listaBoletas, listaSuscripciones]) => {
        setBoletas(listaBoletas);
        setSuscripciones(listaSuscripciones.data);
        setError(null);
      })
      .catch((err) => setError(mensajeDeError(err)))
      .finally(() => setCargando(false));
  }, []);

  function cambiarMes(delta: number) {
    const nueva = new Date(periodo.anio, periodo.mes + delta, 1);
    setPeriodo({ anio: nueva.getFullYear(), mes: nueva.getMonth() });
    setSeleccionado(null);
  }

  const eventos = armarEventos(periodo.anio, periodo.mes, boletas, suscripciones);
  const total = diasDelMes(periodo.anio, periodo.mes);
  const desplazamiento = (new Date(periodo.anio, periodo.mes, 1).getDay() + 6) % 7;
  const celdas: (number | null)[] = [
    ...Array<null>(desplazamiento).fill(null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);

  const todos = [...eventos.values()].flat();
  const pendiente = todos
    .filter((e) => e.tipo === 'boleta')
    .reduce((suma, e) => suma + e.monto, 0);
  const cobros = todos
    .filter((e) => e.tipo === 'suscripcion')
    .reduce((suma, e) => suma + e.monto, 0);
  const esHoy = (dia: number) =>
    dia === hoy.getDate() &&
    periodo.mes === hoy.getMonth() &&
    periodo.anio === hoy.getFullYear();
  const detalle = seleccionado ? (eventos.get(seleccionado) ?? []) : [];

  return (
    <div className={estilos.pagina}>
      <div className={estilos.cabecera}>
        <h1>Calendario</h1>
        <div className={estilos.navegacion}>
          <button type="button" className={estilos.boton} onClick={() => cambiarMes(-1)}>
            Anterior
          </button>
          <span className={estilos.mes}>
            {MESES[periodo.mes]} {periodo.anio}
          </span>
          <button type="button" className={estilos.boton} onClick={() => cambiarMes(1)}>
            Siguiente
          </button>
        </div>
      </div>

      {error && (
        <div className={estilos.error} role="alert">
          {error}
        </div>
      )}

      {cargando ? (
        <p className={estilos.vacio}>Cargando datos...</p>
      ) : (
        <>
          <div className={estilos.resumen}>
            <p>Boletas pendientes del mes: {formatearMonto(pendiente)}</p>
            <p>Cobros de suscripciones del mes: {formatearMonto(cobros)}</p>
          </div>

          <div className={estilos.leyenda}>
            <span className={`${estilos.chip} ${estilos.boleta}`}>Boleta pendiente</span>
            <span className={`${estilos.chip} ${estilos.boletaPagada}`}>Boleta pagada</span>
            <span className={`${estilos.chip} ${estilos.suscripcion}`}>Cobro de suscripcion</span>
          </div>

          <div className={estilos.grilla}>
            {DIAS.map((dia) => (
              <div className={estilos.diaSemana} key={dia}>
                {dia}
              </div>
            ))}
            {celdas.map((dia, indice) => {
              if (dia === null) {
                return <div className={estilos.celdaVacia} key={`vacia-${indice}`} />;
              }
              const lista = eventos.get(dia) ?? [];
              const clases = [
                estilos.celda,
                esHoy(dia) ? estilos.celdaHoy : '',
                seleccionado === dia ? estilos.celdaActiva : '',
              ].join(' ');
              return (
                <button
                  type="button"
                  className={clases}
                  key={dia}
                  onClick={() => setSeleccionado(dia)}
                >
                  <span className={estilos.numero}>{dia}</span>
                  {lista.slice(0, VISIBLES_POR_DIA).map((e) => (
                    <span className={`${estilos.chip} ${claseEvento(e.tipo)}`} key={e.clave}>
                      {e.titulo}
                    </span>
                  ))}
                  {lista.length > VISIBLES_POR_DIA && (
                    <span className={estilos.mas}>
                      +{lista.length - VISIBLES_POR_DIA} mas
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {seleccionado !== null && (
            <section className={estilos.detalle}>
              <h2>
                {seleccionado} de {MESES[periodo.mes]}
              </h2>
              {detalle.length === 0 ? (
                <p className={estilos.vacio}>No hay eventos este dia.</p>
              ) : (
                detalle.map((e) => (
                  <div className={estilos.fila} key={e.clave}>
                    <span className={`${estilos.chip} ${claseEvento(e.tipo)}`}>{e.titulo}</span>
                    <span>{formatearMonto(e.monto)}</span>
                  </div>
                ))
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default Calendario;
