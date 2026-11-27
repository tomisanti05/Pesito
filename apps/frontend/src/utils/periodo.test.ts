import { describe, expect, it } from 'vitest';
import type { Transaccion } from '../types/finanzas';
import {
  aISO,
  celdasDelMes,
  diasEntre,
  esFechaFutura,
  esMesFuturo,
  etiquetaDeMeses,
  etiquetaDePeriodo,
  etiquetaDeRango,
  filtrarPorPeriodo,
  limitesDeAnios,
  mesDeISO,
  mesDelPeriodo,
  mesesConDatos,
  rangoDePeriodo,
  seleccionarDiaEnRango,
} from './periodo';

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

describe('aISO', () => {
  it('formatea una fecha local como YYYY-MM-DD', () => {
    expect(aISO(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('mesDeISO', () => {
  it('devuelve el primer día del mes de una fecha ISO', () => {
    expect(aISO(mesDeISO('2026-11-26'))).toBe('2026-11-01');
  });
});

describe('rangoDePeriodo', () => {
  it('devuelve el mes actual completo', () => {
    expect(rangoDePeriodo({ tipo: 'preset', preset: 'mesActual' }, HOY)).toEqual({
      desde: '2026-11-01',
      hasta: '2026-11-30',
    });
  });

  it('devuelve el mes anterior completo', () => {
    expect(
      rangoDePeriodo({ tipo: 'preset', preset: 'mesAnterior' }, HOY),
    ).toEqual({
      desde: '2026-10-01',
      hasta: '2026-10-31',
    });
  });

  it('devuelve los últimos tres meses completos', () => {
    expect(
      rangoDePeriodo({ tipo: 'preset', preset: 'ultimos3Meses' }, HOY),
    ).toEqual({
      desde: '2026-09-01',
      hasta: '2026-11-30',
    });
  });

  it('retrocede de año al calcular el mes anterior en enero', () => {
    const enero = new Date(2026, 0, 15);

    expect(
      rangoDePeriodo({ tipo: 'preset', preset: 'mesAnterior' }, enero),
    ).toEqual({
      desde: '2025-12-01',
      hasta: '2025-12-31',
    });
    expect(
      rangoDePeriodo({ tipo: 'preset', preset: 'ultimos3Meses' }, enero),
    ).toEqual({
      desde: '2025-11-01',
      hasta: '2026-01-31',
    });
  });

  it('devuelve un mes puntual completo', () => {
    expect(rangoDePeriodo({ tipo: 'mes', anio: 2026, mes: 1 }, HOY)).toEqual({
      desde: '2026-02-01',
      hasta: '2026-02-28',
    });
  });

  it('tiene en cuenta los años bisiestos', () => {
    expect(rangoDePeriodo({ tipo: 'mes', anio: 2028, mes: 1 }, HOY)).toEqual({
      desde: '2028-02-01',
      hasta: '2028-02-29',
    });
  });

  it('devuelve un rango personalizado tal cual', () => {
    expect(
      rangoDePeriodo({
        tipo: 'rango',
        desde: '2026-11-12',
        hasta: '2026-11-26',
      }),
    ).toEqual({
      desde: '2026-11-12',
      hasta: '2026-11-26',
    });
  });
});

describe('filtrarPorPeriodo', () => {
  const movimientos = [
    tx({ idTransaccion: 1, fecha: '2026-11-01' }),
    tx({ idTransaccion: 2, fecha: '2026-11-15' }),
    tx({ idTransaccion: 3, fecha: '2026-11-30' }),
    tx({ idTransaccion: 4, fecha: '2026-10-31' }),
    tx({ idTransaccion: 5, fecha: '2026-12-01' }),
  ];

  it('filtra solo el mes actual', () => {
    expect(
      filtrarPorPeriodo(
        movimientos,
        { tipo: 'preset', preset: 'mesActual' },
        HOY,
      ).map((t) => t.idTransaccion),
    ).toEqual([1, 2, 3]);
  });

  it('incluye ambos extremos de un rango personalizado', () => {
    expect(
      filtrarPorPeriodo(
        movimientos,
        { tipo: 'rango', desde: '2026-11-02', hasta: '2026-11-30' },
        HOY,
      ).map((t) => t.idTransaccion),
    ).toEqual([2, 3]);
  });

  it('filtra un rango que cruza de año', () => {
    const entreAnios = [
      tx({ idTransaccion: 6, fecha: '2025-12-31' }),
      tx({ idTransaccion: 7, fecha: '2026-01-01' }),
      tx({ idTransaccion: 8, fecha: '2026-01-02' }),
    ];

    expect(
      filtrarPorPeriodo(
        entreAnios,
        { tipo: 'rango', desde: '2025-12-31', hasta: '2026-01-01' },
        HOY,
      ).map((t) => t.idTransaccion),
    ).toEqual([6, 7]);
  });
});

describe('celdasDelMes', () => {
  it('arma 42 celdas que empiezan el lunes', () => {
    const celdas = celdasDelMes(2026, 10);

    expect(celdas).toHaveLength(42);
    expect(celdas[0]).toEqual({
      fecha: '2026-10-26',
      dia: 26,
      mes: 9,
      anio: 2026,
      delMes: false,
    });
    expect(celdas[6]).toMatchObject({
      fecha: '2026-11-01',
      dia: 1,
      delMes: true,
    });
    expect(celdas.at(-1)).toEqual({
      fecha: '2026-12-06',
      dia: 6,
      mes: 11,
      anio: 2026,
      delMes: false,
    });
  });

  it('empieza directo en el día 1 cuando el mes arranca un lunes', () => {
    const celdas = celdasDelMes(2026, 5);

    expect(celdas[0]).toMatchObject({ fecha: '2026-06-01', delMes: true });
  });
});

describe('etiquetaDePeriodo', () => {
  it('usa las etiquetas de los atajos', () => {
    expect(etiquetaDePeriodo({ tipo: 'preset', preset: 'mesActual' })).toBe(
      'Este mes',
    );
    expect(etiquetaDePeriodo({ tipo: 'preset', preset: 'mesAnterior' })).toBe(
      'Mes anterior',
    );
    expect(etiquetaDePeriodo({ tipo: 'preset', preset: 'ultimos3Meses' })).toBe(
      'Últimos 3 meses',
    );
  });

  it('muestra el mes y el año elegidos', () => {
    expect(etiquetaDePeriodo({ tipo: 'mes', anio: 2026, mes: 10 })).toBe(
      'Noviembre 2026',
    );
  });

  it('resume un rango dentro del mismo mes', () => {
    expect(
      etiquetaDePeriodo({
        tipo: 'rango',
        desde: '2026-11-12',
        hasta: '2026-11-26',
      }),
    ).toBe('12 – 26 nov 2026');
  });

  it('resume un rango de un solo día', () => {
    expect(
      etiquetaDePeriodo({
        tipo: 'rango',
        desde: '2026-11-12',
        hasta: '2026-11-12',
      }),
    ).toBe('12 nov 2026');
  });

  it('resume un rango entre meses del mismo año', () => {
    expect(
      etiquetaDePeriodo({
        tipo: 'rango',
        desde: '2026-10-28',
        hasta: '2026-11-04',
      }),
    ).toBe('28 oct – 4 nov 2026');
  });

  it('resume un rango que cruza de año', () => {
    expect(
      etiquetaDePeriodo({
        tipo: 'rango',
        desde: '2025-12-28',
        hasta: '2026-01-04',
      }),
    ).toBe('28 dic 2025 – 4 ene 2026');
  });
});

describe('mesesConDatos', () => {
  it('devuelve las claves de los meses con movimientos', () => {
    const movimientos = [
      tx({ fecha: '2026-11-10' }),
      tx({ fecha: '2026-11-30' }),
      tx({ fecha: '2026-10-01' }),
      tx({ fecha: '2026-12-31' }),
      tx({ fecha: '2025-01-01' }),
    ];

    expect([...mesesConDatos(movimientos)].sort()).toEqual([
      '2025-01',
      '2026-10',
      '2026-11',
      '2026-12',
    ]);
  });

  it('devuelve un set vacío sin movimientos', () => {
    expect(mesesConDatos([]).size).toBe(0);
  });
});

describe('limitesDeAnios', () => {
  it('incluye los años con datos y el año actual', () => {
    expect(
      limitesDeAnios(
        [tx({ fecha: '2025-06-01' }), tx({ fecha: '2026-01-01' })],
        HOY,
      ),
    ).toEqual({ minimo: 2025, maximo: 2026 });
  });

  it('usa el año actual cuando no hay movimientos', () => {
    expect(limitesDeAnios([], HOY)).toEqual({ minimo: 2026, maximo: 2026 });
  });

  it('toma el mínimo y el máximo entre los datos y el año actual', () => {
    expect(
      limitesDeAnios(
        [tx({ fecha: '2024-03-01' }), tx({ fecha: '2028-03-01' })],
        HOY,
      ),
    ).toEqual({ minimo: 2024, maximo: 2028 });
  });
});

describe('esMesFuturo', () => {
  it('marca los meses posteriores al actual', () => {
    expect(esMesFuturo(2026, 10, HOY)).toBe(false);
    expect(esMesFuturo(2026, 11, HOY)).toBe(true);
    expect(esMesFuturo(2027, 0, HOY)).toBe(true);
    expect(esMesFuturo(2025, 11, HOY)).toBe(false);
  });
});

describe('esFechaFutura', () => {
  it('compara contra el día de hoy', () => {
    expect(esFechaFutura('2026-11-14', HOY)).toBe(false);
    expect(esFechaFutura('2026-11-15', HOY)).toBe(false);
    expect(esFechaFutura('2026-11-16', HOY)).toBe(true);
  });
});

describe('mesDelPeriodo', () => {
  it('traduce los presets de un mes', () => {
    expect(
      mesDelPeriodo({ tipo: 'preset', preset: 'mesActual' }, HOY),
    ).toEqual({ anio: 2026, mes: 10 });
    expect(
      mesDelPeriodo({ tipo: 'preset', preset: 'mesAnterior' }, HOY),
    ).toEqual({ anio: 2026, mes: 9 });
  });

  it('traduce el mes anterior en enero', () => {
    expect(
      mesDelPeriodo(
        { tipo: 'preset', preset: 'mesAnterior' },
        new Date(2026, 0, 15),
      ),
    ).toEqual({ anio: 2025, mes: 11 });
  });

  it('devuelve null para períodos sin un mes único', () => {
    expect(
      mesDelPeriodo({ tipo: 'preset', preset: 'ultimos3Meses' }, HOY),
    ).toBeNull();
    expect(
      mesDelPeriodo(
        { tipo: 'rango', desde: '2026-11-12', hasta: '2026-11-26' },
        HOY,
      ),
    ).toBeNull();
  });

  it('devuelve el mes elegido', () => {
    expect(mesDelPeriodo({ tipo: 'mes', anio: 2026, mes: 2 }, HOY)).toEqual({
      anio: 2026,
      mes: 2,
    });
  });
});

describe('etiquetaDeMeses', () => {
  it('muestra dos meses del mismo año', () => {
    expect(etiquetaDeMeses(new Date(2026, 10, 1))).toBe(
      'Noviembre – Diciembre 2026',
    );
  });

  it('muestra ambos años cuando cruza de año', () => {
    expect(etiquetaDeMeses(new Date(2026, 11, 1))).toBe(
      'Diciembre 2026 – Enero 2027',
    );
    expect(etiquetaDeMeses(new Date(2025, 11, 1))).toBe(
      'Diciembre 2025 – Enero 2026',
    );
  });
});

describe('etiquetaDeRango', () => {
  it('incluye los días y el mes', () => {
    expect(etiquetaDeRango('2026-11-12', '2026-11-26')).toBe(
      '12 – 26 nov 2026',
    );
  });
});

describe('diasEntre', () => {
  it('cuenta ambos extremos', () => {
    expect(diasEntre('2026-11-12', '2026-11-26')).toBe(15);
    expect(diasEntre('2026-11-12', '2026-11-12')).toBe(1);
  });

  it('cuenta rangos que cruzan de año', () => {
    expect(diasEntre('2025-12-31', '2026-01-01')).toBe(2);
  });

  it('cuenta el 29 de febrero de un año bisiesto', () => {
    expect(diasEntre('2028-02-28', '2028-03-01')).toBe(3);
  });
});

describe('seleccionarDiaEnRango', () => {
  it('inicia el rango con el primer click', () => {
    expect(seleccionarDiaEnRango({ desde: null, hasta: null }, '2026-11-12'))
      .toEqual({ desde: '2026-11-12', hasta: null });
  });

  it('cierra el rango con un click posterior', () => {
    expect(
      seleccionarDiaEnRango(
        { desde: '2026-11-12', hasta: null },
        '2026-11-26',
      ),
    ).toEqual({ desde: '2026-11-12', hasta: '2026-11-26' });
  });

  it('invierte los extremos si el segundo click es anterior', () => {
    expect(
      seleccionarDiaEnRango(
        { desde: '2026-11-12', hasta: null },
        '2026-11-05',
      ),
    ).toEqual({ desde: '2026-11-05', hasta: '2026-11-12' });
  });

  it('permite un rango de un solo día', () => {
    expect(
      seleccionarDiaEnRango(
        { desde: '2026-11-12', hasta: null },
        '2026-11-12',
      ),
    ).toEqual({ desde: '2026-11-12', hasta: '2026-11-12' });
  });

  it('reinicia el rango si ya estaba completo', () => {
    expect(
      seleccionarDiaEnRango(
        { desde: '2026-11-12', hasta: '2026-11-26' },
        '2026-12-01',
      ),
    ).toEqual({ desde: '2026-12-01', hasta: null });
  });
});
