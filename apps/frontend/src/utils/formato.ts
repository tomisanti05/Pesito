export const formatearFecha = (fechaISO: string) =>
  new Date(fechaISO + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });

export const formatearMonto = (valor: number) => '$' + valor.toLocaleString('es-AR');

export const fechaDeHoy = () => new Date().toLocaleDateString('en-CA');