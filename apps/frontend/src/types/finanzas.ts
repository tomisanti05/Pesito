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

export type RolUsuario = "usuario" | "admin";

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  rol: RolUsuario;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TipoTarjeta = "visa" | "mastercard" | "amex" | "otra";

export interface Tarjeta {
  id: number;
  idUsuario: number;
  tipo: TipoTarjeta;
  ultimosCuatro: string;
  titular: string;
  vencimiento: string;
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
