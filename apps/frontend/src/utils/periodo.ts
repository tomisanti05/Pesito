import type { Transaccion } from '../types/finanzas';

export type PeriodoPreset = 'mesActual' | 'mesAnterior' | 'ultimos3Meses';

export type PeriodoSeleccionado =
  | { tipo: 'preset'; preset: PeriodoPreset }
  | { tipo: 'mes'; anio: number; mes: number }
  | { tipo: 'rango'; desde: string; hasta: string };

export interface RangoFechas {
  desde: string;
  hasta: string;
}

export interface CeldaCalendario {
  fecha: string;
  dia: number;
  mes: number;
  anio: number;
  delMes: boolean;
}

export interface BorradorRango {
  desde: string | null;
  hasta: string | null;
}

export const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

export const MESES_CORTOS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
] as const;

export const ETIQUETAS_PRESET: Record<PeriodoPreset, string> = {
  mesActual: 'Este mes',
  mesAnterior: 'Mes anterior',
  ultimos3Meses: 'Últimos 3 meses',
};

const MS_POR_DIA = 24 * 60 * 60 * 1000;

function descomponerISO(iso: string): {
  anio: number;
  mes: number;
  dia: number;
} {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return { anio, mes: mes - 1, dia };
}

function rangoDeMes(anio: number, mes: number): RangoFechas {
  return {
    desde: aISO(new Date(anio, mes, 1)),
    hasta: aISO(new Date(anio, mes + 1, 0)),
  };
}

export function aISO(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

export function mesDeISO(iso: string): Date {
  const { anio, mes } = descomponerISO(iso);
  return new Date(anio, mes, 1);
}

export function rangoDePeriodo(
  periodo: PeriodoSeleccionado,
  hoy: Date = new Date(),
): RangoFechas {
  if (periodo.tipo === 'mes') {
    return rangoDeMes(periodo.anio, periodo.mes);
  }

  if (periodo.tipo === 'rango') {
    return { desde: periodo.desde, hasta: periodo.hasta };
  }

  const anio = hoy.getFullYear();
  const mes = hoy.getMonth();

  if (periodo.preset === 'ultimos3Meses') {
    return {
      desde: aISO(new Date(anio, mes - 2, 1)),
      hasta: aISO(new Date(anio, mes + 1, 0)),
    };
  }

  const desplazamiento = periodo.preset === 'mesAnterior' ? -1 : 0;
  return rangoDeMes(anio, mes + desplazamiento);
}

export function filtrarPorPeriodo(
  transacciones: Transaccion[],
  periodo: PeriodoSeleccionado,
  hoy: Date = new Date(),
): Transaccion[] {
  const { desde, hasta } = rangoDePeriodo(periodo, hoy);
  return transacciones.filter(
    (transaccion) => transaccion.fecha >= desde && transaccion.fecha <= hasta,
  );
}

export function etiquetaDePeriodo(periodo: PeriodoSeleccionado): string {
  if (periodo.tipo === 'preset') return ETIQUETAS_PRESET[periodo.preset];
  if (periodo.tipo === 'mes') return `${MESES[periodo.mes]} ${periodo.anio}`;
  return etiquetaDeRango(periodo.desde, periodo.hasta);
}

export function mesesConDatos(transacciones: Transaccion[]): Set<string> {
  return new Set(transacciones.map((transaccion) => transaccion.fecha.slice(0, 7)));
}

export function limitesDeAnios(
  transacciones: Transaccion[],
  hoy: Date = new Date(),
): { minimo: number; maximo: number } {
  const anios = [...mesesConDatos(transacciones)].map((clave) =>
    Number(clave.slice(0, 4)),
  );
  const actual = hoy.getFullYear();

  return {
    minimo: Math.min(actual, ...anios),
    maximo: Math.max(actual, ...anios),
  };
}

export function esMesFuturo(
  anio: number,
  mes: number,
  hoy: Date = new Date(),
): boolean {
  return (
    anio > hoy.getFullYear() ||
    (anio === hoy.getFullYear() && mes > hoy.getMonth())
  );
}

export function esFechaFutura(fecha: string, hoy: Date = new Date()): boolean {
  return fecha > aISO(hoy);
}

export function mesDelPeriodo(
  periodo: PeriodoSeleccionado,
  hoy: Date = new Date(),
): { anio: number; mes: number } | null {
  if (periodo.tipo === 'mes') {
    return { anio: periodo.anio, mes: periodo.mes };
  }

  if (periodo.tipo === 'rango') return null;

  const retroceso =
    periodo.preset === 'mesActual'
      ? 0
      : periodo.preset === 'mesAnterior'
        ? 1
        : null;

  if (retroceso === null) return null;

  const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - retroceso, 1);
  return { anio: fecha.getFullYear(), mes: fecha.getMonth() };
}

export function celdasDelMes(anio: number, mes: number): CeldaCalendario[] {
  const primerDia = new Date(anio, mes, 1);
  const desplazamiento = (primerDia.getDay() + 6) % 7;
  const inicio = new Date(anio, mes, 1 - desplazamiento);

  return Array.from({ length: 42 }, (_, indice) => {
    const fecha = new Date(
      inicio.getFullYear(),
      inicio.getMonth(),
      inicio.getDate() + indice,
    );

    return {
      fecha: aISO(fecha),
      dia: fecha.getDate(),
      mes: fecha.getMonth(),
      anio: fecha.getFullYear(),
      delMes: fecha.getMonth() === mes && fecha.getFullYear() === anio,
    };
  });
}

export function etiquetaDeMeses(primerMes: Date): string {
  const primero = new Date(primerMes.getFullYear(), primerMes.getMonth(), 1);
  const segundo = new Date(
    primero.getFullYear(),
    primero.getMonth() + 1,
    1,
  );

  if (primero.getFullYear() === segundo.getFullYear()) {
    return `${MESES[primero.getMonth()]} – ${MESES[segundo.getMonth()]} ${primero.getFullYear()}`;
  }

  return `${MESES[primero.getMonth()]} ${primero.getFullYear()} – ${MESES[segundo.getMonth()]} ${segundo.getFullYear()}`;
}

export function etiquetaDeRango(desde: string, hasta: string): string {
  const inicio = descomponerISO(desde);
  const fin = descomponerISO(hasta);

  if (inicio.anio === fin.anio && inicio.mes === fin.mes) {
    const dias =
      inicio.dia === fin.dia
        ? String(inicio.dia)
        : `${inicio.dia} – ${fin.dia}`;
    return `${dias} ${MESES_CORTOS[inicio.mes]} ${inicio.anio}`;
  }

  if (inicio.anio === fin.anio) {
    return `${inicio.dia} ${MESES_CORTOS[inicio.mes]} – ${fin.dia} ${MESES_CORTOS[fin.mes]} ${inicio.anio}`;
  }

  return `${inicio.dia} ${MESES_CORTOS[inicio.mes]} ${inicio.anio} – ${fin.dia} ${MESES_CORTOS[fin.mes]} ${fin.anio}`;
}

export function diasEntre(desde: string, hasta: string): number {
  const inicio = descomponerISO(desde);
  const fin = descomponerISO(hasta);
  const diferencia =
    Date.UTC(fin.anio, fin.mes, fin.dia) -
    Date.UTC(inicio.anio, inicio.mes, inicio.dia);

  return Math.round(diferencia / MS_POR_DIA) + 1;
}

export function seleccionarDiaEnRango(
  borrador: BorradorRango,
  fecha: string,
): BorradorRango {
  if (!borrador.desde || borrador.hasta) {
    return { desde: fecha, hasta: null };
  }

  if (fecha < borrador.desde) {
    return { desde: fecha, hasta: borrador.desde };
  }

  return { desde: borrador.desde, hasta: fecha };
}
