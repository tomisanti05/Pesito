import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import type { Transaccion } from '../types/finanzas';
import {
  aISO,
  celdasDelMes,
  diasEntre,
  esFechaFutura,
  esMesFuturo,
  ETIQUETAS_PRESET,
  etiquetaDeMeses,
  etiquetaDePeriodo,
  etiquetaDeRango,
  limitesDeAnios,
  MESES,
  mesDeISO,
  mesDelPeriodo,
  mesesConDatos,
  seleccionarDiaEnRango,
  type BorradorRango,
  type PeriodoPreset,
  type PeriodoSeleccionado,
} from '../utils/periodo';
import './SelectorPeriodo.css';

interface Props {
  valor: PeriodoSeleccionado;
  onChange: (periodo: PeriodoSeleccionado) => void;
  movimientos: Transaccion[];
  etiqueta: string;
}

type Pestana = 'mes' | 'rango';

const PRESETS: readonly PeriodoPreset[] = [
  'mesActual',
  'mesAnterior',
  'ultimos3Meses',
];

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

function SelectorPeriodo({ valor, onChange, movimientos, etiqueta }: Props) {
  const hoy = useMemo(() => new Date(), []);
  const hoyISO = useMemo(() => aISO(hoy), [hoy]);
  const idBase = useId();

  const [abierto, setAbierto] = useState(false);
  const [abreArriba, setAbreArriba] = useState(false);
  const [altoDisponible, setAltoDisponible] = useState(680);
  const [pestana, setPestana] = useState<Pestana>('mes');
  const [anioVisible, setAnioVisible] = useState(() => hoy.getFullYear());
  const [mesVisible, setMesVisible] = useState(
    () => new Date(hoy.getFullYear(), hoy.getMonth(), 1),
  );
  const [borrador, setBorrador] = useState<BorradorRango>({
    desde: null,
    hasta: null,
  });
  const [hover, setHover] = useState<string | null>(null);

  const contenedorRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const tabMesRef = useRef<HTMLButtonElement>(null);
  const tabRangoRef = useRef<HTMLButtonElement>(null);

  const mesesConDatosSet = useMemo(
    () => mesesConDatos(movimientos),
    [movimientos],
  );
  const limites = useMemo(
    () => limitesDeAnios(movimientos, hoy),
    [movimientos, hoy],
  );
  const mesElegido = useMemo(
    () => mesDelPeriodo(valor, hoy),
    [valor, hoy],
  );

  const cerrar = useCallback(() => {
    setAbierto(false);
    setHover(null);
    triggerRef.current?.focus();
  }, []);

  function abrir() {
    const mes = mesDelPeriodo(valor, hoy);
    const mesInicial =
      valor.tipo === 'rango'
        ? mesDeISO(valor.desde)
        : mes
          ? new Date(mes.anio, mes.mes, 1)
          : new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const rect = triggerRef.current?.getBoundingClientRect();

    if (rect) {
      const margen = 16;
      const espacioAbajo = window.innerHeight - rect.bottom - margen;
      const espacioArriba = rect.top - margen;
      const arriba = espacioAbajo < 480 && espacioArriba > espacioAbajo;

      setAbreArriba(arriba);
      setAltoDisponible(
        Math.max(
          260,
          Math.min(680, arriba ? espacioArriba : espacioAbajo),
        ),
      );
    }

    setAnioVisible(mes?.anio ?? mesInicial.getFullYear());
    setMesVisible(mesInicial);
    setBorrador(
      valor.tipo === 'rango'
        ? { desde: valor.desde, hasta: valor.hasta }
        : { desde: null, hasta: null },
    );
    setPestana(valor.tipo === 'rango' ? 'rango' : 'mes');
    setHover(null);
    setAbierto(true);
  }

  function alternar() {
    if (abierto) {
      cerrar();
    } else {
      abrir();
    }
  }

  useEffect(() => {
    if (!abierto) return;
    panelRef.current?.focus();
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;

    const overflowAnterior = document.body.style.overflow;
    if (window.matchMedia('(max-width: 640px)').matches) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;

    function alPresionarFuera(evento: PointerEvent) {
      if (!contenedorRef.current?.contains(evento.target as Node)) {
        cerrar();
      }
    }

    function alPresionarTecla(evento: globalThis.KeyboardEvent) {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        cerrar();
      }
    }

    document.addEventListener('pointerdown', alPresionarFuera);
    document.addEventListener('keydown', alPresionarTecla);

    return () => {
      document.removeEventListener('pointerdown', alPresionarFuera);
      document.removeEventListener('keydown', alPresionarTecla);
    };
  }, [abierto, cerrar]);

  function aplicarPreset(preset: PeriodoPreset) {
    onChange({ tipo: 'preset', preset });
    cerrar();
  }

  function aplicarMes(anio: number, mes: number) {
    onChange({ tipo: 'mes', anio, mes });
    cerrar();
  }

  function aplicarRango() {
    if (!borrador.desde || !borrador.hasta) return;
    onChange({ tipo: 'rango', desde: borrador.desde, hasta: borrador.hasta });
    cerrar();
  }

  function elegirDia(fecha: string) {
    if (esFechaFutura(fecha, hoy)) return;
    setBorrador((actual) => seleccionarDiaEnRango(actual, fecha));
    setHover(null);
  }

  function manejarTeclasPestana(evento: KeyboardEvent<HTMLButtonElement>) {
    if (evento.key !== 'ArrowLeft' && evento.key !== 'ArrowRight') return;

    evento.preventDefault();
    const siguiente: Pestana = pestana === 'mes' ? 'rango' : 'mes';
    setPestana(siguiente);
    (siguiente === 'mes' ? tabMesRef : tabRangoRef).current?.focus();
  }

  function cambiarAnio(delta: number) {
    setAnioVisible((actual) => actual + delta);
  }

  function cambiarMesRango(delta: number) {
    setMesVisible((actual) => {
      return new Date(actual.getFullYear(), actual.getMonth() + delta, 1);
    });
    setHover(null);
  }

  const hastaVisual =
    borrador.hasta ??
    (borrador.desde && hover && hover >= borrador.desde ? hover : null);

  const enPrimerMes =
    mesVisible.getFullYear() === limites.minimo &&
    mesVisible.getMonth() === 0;
  const enUltimoMes =
    mesVisible.getFullYear() === hoy.getFullYear() &&
    mesVisible.getMonth() >= hoy.getMonth();

  const segundoMes = new Date(
    mesVisible.getFullYear(),
    mesVisible.getMonth() + 1,
    1,
  );

  let textoRango = 'Elegí el día de inicio.';
  if (borrador.desde && borrador.hasta) {
    const dias = diasEntre(borrador.desde, borrador.hasta);
    textoRango = `${etiquetaDeRango(borrador.desde, borrador.hasta)} · ${dias} ${
      dias === 1 ? 'día' : 'días'
    }`;
  } else if (borrador.desde) {
    textoRango = `${etiquetaDeRango(borrador.desde, borrador.desde)} · Elegí el día de fin.`;
  }

  function renderizarCalendario(anio: number, mes: number, clave: string) {
    return (
      <div className="selector-periodo-mes" key={clave}>
        <p className="selector-periodo-mes-titulo">
          {MESES[mes]} {anio}
        </p>
        <div className="selector-periodo-semana" aria-hidden="true">
          {DIAS_SEMANA.map((dia) => (
            <span key={dia}>{dia}</span>
          ))}
        </div>
        <div className="selector-periodo-dias">
          {celdasDelMes(anio, mes).map((celda) => {
            const esInicio = borrador.desde === celda.fecha;
            const esFin = hastaVisual === celda.fecha;
            const enRango =
              borrador.desde !== null &&
              hastaVisual !== null &&
              celda.fecha >= borrador.desde &&
              celda.fecha <= hastaVisual;
            const futuro = esFechaFutura(celda.fecha, hoy);
            const clases = ['selector-periodo-dia'];

            if (!celda.delMes) clases.push('fuera');
            if (futuro) clases.push('futuro');
            if (enRango) clases.push('en-rango');
            if (esInicio) clases.push('inicio');
            if (esFin) clases.push('fin');
            if (celda.fecha === hoyISO) clases.push('hoy');

            return (
              <button
                key={celda.fecha}
                type="button"
                className={clases.join(' ')}
                disabled={futuro}
                aria-label={`${celda.dia} de ${MESES[celda.mes]} de ${celda.anio}`}
                aria-pressed={esInicio || esFin}
                onClick={() => elegirDia(celda.fecha)}
                onMouseEnter={() => {
                  if (!futuro) setHover(celda.fecha);
                }}
              >
                <span className="selector-periodo-dia-numero">
                  {celda.dia}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="selector-periodo" ref={contenedorRef}>
      <button
        ref={triggerRef}
        type="button"
        className="selector-periodo-trigger"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-label={`${etiqueta}: ${etiquetaDePeriodo(valor)}`}
        onClick={alternar}
      >
        <CalendarDays size={16} aria-hidden="true" />
        <span className="selector-periodo-etiqueta">
          {etiquetaDePeriodo(valor)}
        </span>
        <ChevronDown
          size={14}
          className="selector-periodo-chevron"
          aria-hidden="true"
        />
      </button>

      {abierto && (
        <>
          <div
            className="selector-periodo-backdrop"
            onClick={cerrar}
            aria-hidden="true"
          />

          <div
            ref={panelRef}
            className={`selector-periodo-panel${
              abreArriba ? ' arriba' : ''
            }`}
            style={
              {
                '--selector-periodo-alto': `${altoDisponible}px`,
              } as CSSProperties
            }
            role="dialog"
            aria-label={etiqueta}
            tabIndex={-1}
          >
            <div className="selector-periodo-topbar">
              <span className="selector-periodo-grabber" aria-hidden="true" />
              <button
                type="button"
                className="selector-periodo-cerrar"
                aria-label="Cerrar selector"
                onClick={cerrar}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="selector-periodo-atajos">
              {PRESETS.map((preset) => {
                const activo =
                  valor.tipo === 'preset' && valor.preset === preset;

                return (
                  <button
                    key={preset}
                    type="button"
                    className={`selector-periodo-atajo${
                      activo ? ' activo' : ''
                    }`}
                    aria-pressed={activo}
                    onClick={() => aplicarPreset(preset)}
                  >
                    {ETIQUETAS_PRESET[preset]}
                  </button>
                );
              })}
            </div>

            <div
              className="selector-periodo-tabs"
              role="tablist"
              aria-label="Elegir período"
            >
              <button
                ref={tabMesRef}
                type="button"
                role="tab"
                id={`${idBase}-tab-mes`}
                className="selector-periodo-tab"
                aria-selected={pestana === 'mes'}
                aria-controls={`${idBase}-panel-mes`}
                tabIndex={pestana === 'mes' ? 0 : -1}
                onClick={() => setPestana('mes')}
                onKeyDown={manejarTeclasPestana}
              >
                Por mes
              </button>
              <button
                ref={tabRangoRef}
                type="button"
                role="tab"
                id={`${idBase}-tab-rango`}
                className="selector-periodo-tab"
                aria-selected={pestana === 'rango'}
                aria-controls={`${idBase}-panel-rango`}
                tabIndex={pestana === 'rango' ? 0 : -1}
                onClick={() => setPestana('rango')}
                onKeyDown={manejarTeclasPestana}
              >
                Rango
              </button>
            </div>

            {pestana === 'mes' ? (
              <div
                id={`${idBase}-panel-mes`}
                role="tabpanel"
                aria-labelledby={`${idBase}-tab-mes`}
              >
                <div className="selector-periodo-anio">
                  <button
                    type="button"
                    className="selector-periodo-flecha"
                    aria-label="Ver año anterior"
                    disabled={anioVisible <= limites.minimo}
                    onClick={() => cambiarAnio(-1)}
                  >
                    <ChevronLeft size={16} aria-hidden="true" />
                  </button>
                  <span aria-live="polite">{anioVisible}</span>
                  <button
                    type="button"
                    className="selector-periodo-flecha"
                    aria-label="Ver año siguiente"
                    disabled={anioVisible >= limites.maximo}
                    onClick={() => cambiarAnio(1)}
                  >
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </div>

                <div className="selector-periodo-meses">
                  {MESES.map((nombre, mes) => {
                    const clave = `${anioVisible}-${String(mes + 1).padStart(
                      2,
                      '0',
                    )}`;
                    const seleccionado =
                      mesElegido?.anio === anioVisible &&
                      mesElegido.mes === mes;
                    const futuro = esMesFuturo(anioVisible, mes, hoy);
                    const tieneDatos = mesesConDatosSet.has(clave);

                    return (
                      <button
                        key={clave}
                        type="button"
                        className={`selector-periodo-mes-boton${
                          seleccionado ? ' activo' : ''
                        }`}
                        disabled={futuro}
                        aria-pressed={seleccionado}
                        aria-label={`${nombre} ${anioVisible}${
                          tieneDatos ? ', con movimientos' : ''
                        }`}
                        onClick={() => aplicarMes(anioVisible, mes)}
                      >
                        <span>{nombre}</span>
                        {tieneDatos && (
                          <span
                            className="selector-periodo-punto"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div
                id={`${idBase}-panel-rango`}
                role="tabpanel"
                aria-labelledby={`${idBase}-tab-rango`}
              >
                <div className="selector-periodo-rango-header">
                  <button
                    type="button"
                    className="selector-periodo-flecha"
                    aria-label="Meses anteriores"
                    disabled={enPrimerMes}
                    onClick={() => cambiarMesRango(-1)}
                  >
                    <ChevronLeft size={16} aria-hidden="true" />
                  </button>
                  <span aria-live="polite">
                    {etiquetaDeMeses(mesVisible)}
                  </span>
                  <button
                    type="button"
                    className="selector-periodo-flecha"
                    aria-label="Meses siguientes"
                    disabled={enUltimoMes}
                    onClick={() => cambiarMesRango(1)}
                  >
                    <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </div>

                <div
                  className="selector-periodo-calendarios"
                  onMouseLeave={() => setHover(null)}
                >
                  {renderizarCalendario(
                    mesVisible.getFullYear(),
                    mesVisible.getMonth(),
                    'primero',
                  )}
                  {renderizarCalendario(
                    segundoMes.getFullYear(),
                    segundoMes.getMonth(),
                    'segundo',
                  )}
                </div>

                <div className="selector-periodo-footer">
                  <p className="selector-periodo-resumen">{textoRango}</p>
                  <div className="selector-periodo-acciones">
                    <button
                      type="button"
                      className="selector-periodo-btn secundario"
                      onClick={cerrar}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="selector-periodo-btn primario"
                      disabled={!borrador.desde || !borrador.hasta}
                      onClick={aplicarRango}
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default SelectorPeriodo;
