import { describe, expect, it } from 'vitest';
import type { Billetera, Transaccion } from '../types/finanzas';
import {
  agruparEgresosPorBilletera,
  agruparEgresosPorCategoria,
  COLOR_OTRAS,
  construirPorciones,
  filtrarPorPeriodo,
  mesesDelPeriodo,
  PALETA_GRAFICO,
  totalesIngresoEgreso,
} from './resumenGastos';

const HOY = new Date(2026, 10, 15); // 15/11/2026

function tx(parcial: Partial<Transaccion>): Transaccion {
  return {
    idTransaccion: 1,
    idBilletera: 1,
    monto: '100.00',
    tipo: 'egreso',
    categoria: 'Comida',
    fecha: '2026-11-10',
    ...parcial,
  };
}

describe('mesesDelPeriodo', () => {
  it('calcula el mes anterior al cambiar de año', () => {
    expect([...mesesDelPeriodo('mesAnterior', new Date(2026, 0, 15))]).toEqual([
      '2025-12',
    ]);
  });

  it('incluye el mes actual y los dos anteriores', () => {
    expect([...mesesDelPeriodo('ultimos3Meses', HOY)].sort()).toEqual([
      '2026-09',
      '2026-10',
      '2026-11',
    ]);
  });
});

describe('filtrarPorPeriodo', () => {
  const movimientos = [
    tx({ idTransaccion: 1, fecha: '2026-11-02' }),
    tx({ idTransaccion: 2, fecha: '2026-10-30' }),
    tx({ idTransaccion: 3, fecha: '2026-09-01' }),
    tx({ idTransaccion: 4, fecha: '2026-08-31' }),
  ];

  it('filtra solo el mes actual', () => {
    expect(
      filtrarPorPeriodo(movimientos, 'mesActual', HOY).map((t) => t.idTransaccion),
    ).toEqual([1]);
  });

  it('filtra los últimos tres meses', () => {
    expect(
      filtrarPorPeriodo(movimientos, 'ultimos3Meses', HOY).map(
        (t) => t.idTransaccion,
      ),
    ).toEqual([1, 2, 3]);
  });
});

describe('agruparEgresosPorCategoria', () => {
  it('suma solo egresos, agrupa y ordena de mayor a menor', () => {
    const datos = agruparEgresosPorCategoria([
      tx({ monto: '1000.10', categoria: 'Comida' }),
      tx({ monto: '500.20', categoria: ' Comida ' }),
      tx({ monto: '200.00', categoria: 'Transporte' }),
      tx({ monto: '5000.00', categoria: 'Sueldo', tipo: 'ingreso' }),
    ]);

    expect(datos).toEqual([
      { etiqueta: 'Comida', monto: 1500.3 },
      { etiqueta: 'Transporte', monto: 200 },
    ]);
  });
});

describe('agruparEgresosPorBilletera', () => {
  it('usa el nombre de la billetera y cae en Cuenta si no existe', () => {
    const billeteras = [
      { idBilletera: 1, nombre: 'Efectivo' } as Billetera,
    ];

    const datos = agruparEgresosPorBilletera(
      [
        tx({ idBilletera: 1, monto: '300.00' }),
        tx({ idBilletera: 99, monto: '100.00' }),
      ],
      billeteras,
    );

    expect(datos).toEqual([
      { etiqueta: 'Efectivo', monto: 300 },
      { etiqueta: 'Cuenta', monto: 100 },
    ]);
  });
});

describe('totalesIngresoEgreso', () => {
  it('suma ingresos y egresos por separado', () => {
    expect(
      totalesIngresoEgreso([
        tx({ tipo: 'ingreso', monto: '5000.00' }),
        tx({ tipo: 'egreso', monto: '1200.50' }),
      ]),
    ).toEqual({ ingresos: 5000, egresos: 1200.5 });
  });
});

describe('construirPorciones', () => {
  it('agrupa el resto en Otras y calcula porcentajes', () => {
    const datos = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((etiqueta, indice) => ({
      etiqueta,
      monto: 70 - indice * 10,
    }));

    const porciones = construirPorciones(datos, PALETA_GRAFICO, 5);

    expect(porciones).toHaveLength(6);
    expect(porciones[5]).toMatchObject({
      etiqueta: 'Otras',
      monto: 30,
      color: COLOR_OTRAS,
    });
    expect(porciones.reduce((acc, p) => acc + p.porcentaje, 0)).toBeCloseTo(100);
  });

  it('devuelve una lista vacía si el total es cero', () => {
    expect(
      construirPorciones([{ etiqueta: 'Sin datos', monto: 0 }], PALETA_GRAFICO),
    ).toEqual([]);
  });
});
