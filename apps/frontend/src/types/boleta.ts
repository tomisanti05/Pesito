export type TipoServicio = 'luz' | 'agua' | 'gas' | 'internet' | 'otro';

export interface Boleta {
  idBoleta: number;
  idUsuario: number;
  tipoServicio: TipoServicio;
  monto: string;
  fechaVencimiento: string;
  pagada: boolean;
  fechaPago?: string | null;
}
