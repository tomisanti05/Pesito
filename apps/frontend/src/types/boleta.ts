export type TipoServicio = 'luz' | 'agua' | 'gas' | 'internet' | 'otro';

export type Boleta = {
  id: number;
  tipo: TipoServicio;
  fechaVencimiento: string;
  monto: number;
  pagada: boolean;
  fechaPago: string;
};