import { describe, expect, it } from 'vitest';
import type { Billetera, Transaccion } from '../types/finanzas';
import {
  agruparEgresosPorBilletera,
  agruparEgresosPorCategoria,
  COLOR_OTRAS,
  construirPorciones,
  PALETA_GRAFICO,
  totalesIngresoEgreso,
} from './resumenGastos';

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
