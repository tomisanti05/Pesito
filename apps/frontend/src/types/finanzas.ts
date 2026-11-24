export interface Billetera {
  idBilletera: number;
  idUsuario: number;
  nombre: string;
  saldo: string;
  tipo: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaccion {
  idTransaccion: number;
  idBilletera: number;
  monto: string;
  tipo: "ingreso" | "egreso";
  categoria: string;
  fecha: string;
  descripcion?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Suscripcion {
  idSuscripcion: number;
  idUsuario: number;
  idTarjeta: number | null;
  proveedor: string;
  plan: string;
  monto: string;
  diaCobro: number;
  activa: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListaPaginada<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
