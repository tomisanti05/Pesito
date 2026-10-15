import { Zap, Droplet, Flame, Wifi, FileText, type LucideIcon } from 'lucide-react';
import type { Boleta, TipoServicio } from '../types/boleta';

export const serviciosDisponibles: Record<TipoServicio, { nombre: string; icono: LucideIcon }> = {
  luz: { nombre: 'Luz', icono: Zap },
  agua: { nombre: 'Agua', icono: Droplet },
  gas: { nombre: 'Gas', icono: Flame },
  internet: { nombre: 'Internet', icono: Wifi },
  otro: { nombre: 'Otro servicio', icono: FileText },
};

export const boletasIniciales: Boleta[] = [
  { id: 1, tipo: 'luz', fechaVencimiento: '2026-09-30', monto: 5000, pagada: false, fechaPago: '' },
  { id: 2, tipo: 'agua', fechaVencimiento: '2026-09-30', monto: 10000, pagada: false, fechaPago: '' },
  { id: 3, tipo: 'gas', fechaVencimiento: '2026-09-30', monto: 3000, pagada: false, fechaPago: '' },
];