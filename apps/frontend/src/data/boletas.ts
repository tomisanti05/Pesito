import { type LucideIcon, Zap, Droplets, Flame, Wifi, FileText } from 'lucide-react';
import type { TipoServicio } from '../types/boleta';

export const serviciosDisponibles: Record<TipoServicio, { nombre: string; icono: LucideIcon }> = {
  luz: { nombre: 'Luz', icono: Zap },
  agua: { nombre: 'Agua', icono: Droplets },
  gas: { nombre: 'Gas', icono: Flame },
  internet: { nombre: 'Internet', icono: Wifi },
  otro: { nombre: 'Otro', icono: FileText },
};
