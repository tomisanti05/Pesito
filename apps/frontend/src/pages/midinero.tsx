import { useState } from 'react';
import './midinero.css';

function MiDinero() {
  const cuentas = [
    { nombre: 'Efectivo', monto: 50000 },
    { nombre: 'Cuenta corriente', monto: 200000 },
    { nombre: 'Caja de ahorro', monto: 100000 },
  ];

  const movimientos = [
    { concepto: 'Sueldo', fecha: '01/09', monto: 250000, tipo: 'ingreso' },
    { concepto: 'Supermercado', fecha: '03/09', monto: 25000, tipo: 'gasto' },
    { concepto: 'Transporte', fecha: '05/09', monto: 12000, tipo: 'gasto' },
    { concepto: 'Alquiler', fecha: '07/09', monto: 80000, tipo: 'gasto' },
    { concepto: 'Freelance', fecha: '10/09', monto: 45000, tipo: 'ingreso' },
    { concepto: 'Internet', fecha: '12/09', monto: 8000, tipo: 'gasto' },
  ];

  const [filtro, setFiltro] = useState('todo');

  const movimientosFiltrados = movimientos.filter((m) =>
    filtro === 'todo' ? true : m.tipo === filtro
  );

  return (
    <div className="midinero">
      <h1>Mi dinero</h1>

      <div className="saldo-card">
        <h2>Dinero total</h2>
        <p className="saldo">$ 350.000</p>
      </div>

      <section className="midinero-seccion">
        <h2>Mis cuentas</h2>
        {cuentas.map((c) => (
          <div key={c.nombre} className="midinero-fila midinero-cuenta">
            <span className="midinero-concepto">{c.nombre}</span>
            <span className="midinero-monto">$ {c.monto.toLocaleString('es-AR')}</span>
          </div>
        ))}
      </section>

      <section className="midinero-seccion">
        <h2>Movimientos</h2>

        <div className="midinero-filtros">
          <button
            className={filtro === 'todo' ? 'activo' : ''}
            onClick={() => setFiltro('todo')}
          >
            Todo
          </button>
          <button
            className={filtro === 'ingreso' ? 'activo' : ''}
            onClick={() => setFiltro('ingreso')}
          >
            Ingresos
          </button>
          <button
            className={filtro === 'gasto' ? 'activo' : ''}
            onClick={() => setFiltro('gasto')}
          >
            Gastos
          </button>
        </div>

        {movimientosFiltrados.map((m) => (
          <div key={m.concepto} className="midinero-fila">
            <span className="midinero-concepto">
              <span className={`dot ${m.tipo}`} />
              {m.concepto}
            </span>
            <span className="midinero-fecha">{m.fecha}</span>
            <span className={m.tipo}>
              {m.tipo === 'ingreso' ? '+' : '-'} $ {m.monto.toLocaleString('es-AR')}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}

export default MiDinero;
