import { formatearMonto } from '../utils/formato';
import type { PorcionGrafico } from '../utils/resumenGastos';
import './GraficoTorta.css';

interface GraficoTortaProps {
  porciones: PorcionGrafico[];
  total: number;
  vacio?: string;
}

const RADIO = 45;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;
const HUECO = 2;

function GraficoTorta({ porciones, total, vacio }: GraficoTortaProps) {
  if (porciones.length === 0 || total <= 0) {
    return <p className="grafico-vacio">{vacio ?? 'No hay datos para mostrar.'}</p>;
  }

  return (
    <div className="grafico-torta">
      <div className="grafico-torta-donut">
        <svg
          viewBox="0 0 120 120"
          width="120"
          height="120"
          aria-hidden="true"
          focusable="false"
        >
          <g transform="rotate(-90 60 60)">
            {porciones.map((porcion, indice) => {
              const largo = (porcion.monto / total) * CIRCUNFERENCIA;
              const visible = Math.max(largo - HUECO, 0);
              const previos = porciones
                .slice(0, indice)
                .reduce((acc, anterior) => acc + anterior.monto, 0);
              const desplazamiento = -((previos / total) * CIRCUNFERENCIA);

              return (
                <circle
                  key={`${porcion.etiqueta}-${indice}`}
                  cx="60"
                  cy="60"
                  r={RADIO}
                  fill="none"
                  stroke={porcion.color}
                  strokeWidth="18"
                  strokeDasharray={`${visible} ${CIRCUNFERENCIA - visible}`}
                  strokeDashoffset={desplazamiento}
                >
                  <title>{porcion.etiqueta}</title>
                </circle>
              );
            })}
          </g>
          <text x="60" y="56" textAnchor="middle" className="grafico-torta-total-label">
            Total
          </text>
          <text x="60" y="74" textAnchor="middle" className="grafico-torta-total-monto">
            {formatearMonto(total)}
          </text>
        </svg>
      </div>

      <ul className="grafico-torta-leyenda">
        {porciones.map((porcion, indice) => (
          <li
            key={`${porcion.etiqueta}-${indice}`}
            className="grafico-torta-item"
          >
            <span
              className="grafico-torta-color"
              style={{ backgroundColor: porcion.color }}
              aria-hidden="true"
            />
            <span className="grafico-torta-etiqueta">{porcion.etiqueta}</span>
            <span className="grafico-torta-porcentaje">
              {Math.round(porcion.porcentaje)}%
            </span>
            <span className="grafico-torta-monto">
              {formatearMonto(porcion.monto)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GraficoTorta;
