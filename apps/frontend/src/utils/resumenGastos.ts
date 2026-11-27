import type { Billetera, Transaccion } from '../types/finanzas';

export type PeriodoGrafico = 'mesActual' | 'mesAnterior' | 'ultimos3Meses';

export interface DatoGrafico {
  etiqueta: string;
  monto: number;
}

export interface PorcionGrafico extends DatoGrafico {
  porcentaje: number;
  color: string;
}

export const PALETA_GRAFICO: readonly string[] = [
  '#5b3ce6',
  '#7c5cf0',
  '#a78bfa',
  '#0ea5e9',
  '#f59e0b',
  '#ec4899',
];

export const COLOR_OTRAS = '#9ca3af';

export const COLORES_BALANCE: readonly [string, string] = ['#16a34a', '#dc2626'];

function claveMes(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
}

function aCentavos(monto: string | number): number {
  return Math.round(Number(monto) * 100);
}

function ordenarDeMayorAMenor(
  acumulado: Map<string, number>,
): DatoGrafico[] {
  return [...acumulado.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([etiqueta, centavos]) => ({ etiqueta, monto: centavos / 100 }));
}

export function mesesDelPeriodo(
  periodo: PeriodoGrafico,
  hoy: Date = new Date(),
): Set<string> {
  const desplazamientos =
    periodo === 'mesActual' ? [0] : periodo === 'mesAnterior' ? [1] : [0, 1, 2];
  const anio = hoy.getFullYear();
  const mes = hoy.getMonth();

  return new Set(
    desplazamientos.map((desplazamiento) =>
      claveMes(new Date(anio, mes - desplazamiento, 1)),
    ),
  );
}

export function filtrarPorPeriodo(
  transacciones: Transaccion[],
  periodo: PeriodoGrafico,
  hoy: Date = new Date(),
): Transaccion[] {
  const meses = mesesDelPeriodo(periodo, hoy);
  return transacciones.filter((transaccion) =>
    meses.has(transaccion.fecha.slice(0, 7)),
  );
}

export function agruparEgresosPorCategoria(
  transacciones: Transaccion[],
): DatoGrafico[] {
  const acumulado = new Map<string, number>();

  for (const transaccion of transacciones) {
    if (transaccion.tipo !== 'egreso') continue;

    const categoria = transaccion.categoria.trim() || 'Sin categoría';
    acumulado.set(
      categoria,
      (acumulado.get(categoria) ?? 0) + aCentavos(transaccion.monto),
    );
  }

  return ordenarDeMayorAMenor(acumulado);
}

export function agruparEgresosPorBilletera(
  transacciones: Transaccion[],
  billeteras: Billetera[],
): DatoGrafico[] {
  const nombres = new Map(
    billeteras.map((billetera) => [billetera.idBilletera, billetera.nombre]),
  );
  const acumulado = new Map<string, number>();

  for (const transaccion of transacciones) {
    if (transaccion.tipo !== 'egreso') continue;

    const nombre = nombres.get(transaccion.idBilletera) ?? 'Cuenta';
    acumulado.set(
      nombre,
      (acumulado.get(nombre) ?? 0) + aCentavos(transaccion.monto),
    );
  }

  return ordenarDeMayorAMenor(acumulado);
}

export function totalesIngresoEgreso(
  transacciones: Transaccion[],
): { ingresos: number; egresos: number } {
  let ingresos = 0;
  let egresos = 0;

  for (const transaccion of transacciones) {
    if (transaccion.tipo === 'ingreso') {
      ingresos += aCentavos(transaccion.monto);
    } else {
      egresos += aCentavos(transaccion.monto);
    }
  }

  return { ingresos: ingresos / 100, egresos: egresos / 100 };
}

export function construirPorciones(
  datos: DatoGrafico[],
  colores: readonly string[],
  maximo = 5,
): PorcionGrafico[] {
  const totalCentavos = datos.reduce(
    (acc, dato) => acc + aCentavos(dato.monto),
    0,
  );

  if (totalCentavos <= 0) return [];

  const principales = datos.slice(0, maximo);
  const restantes = datos.slice(maximo);

  const porciones = principales.map((dato, indice) => {
    const centavos = aCentavos(dato.monto);
    return {
      etiqueta: dato.etiqueta,
      monto: centavos / 100,
      porcentaje: (centavos / totalCentavos) * 100,
      color: colores[indice % colores.length] ?? COLOR_OTRAS,
    };
  });

  if (restantes.length > 0) {
    const centavos = restantes.reduce(
      (acc, dato) => acc + aCentavos(dato.monto),
      0,
    );
    porciones.push({
      etiqueta: 'Otras',
      monto: centavos / 100,
      porcentaje: (centavos / totalCentavos) * 100,
      color: COLOR_OTRAS,
    });
  }

  return porciones;
}
