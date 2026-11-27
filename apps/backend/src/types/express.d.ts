import type { RolUsuario } from "../modules/models/user.js";

declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id: number;
        rol: RolUsuario;
      };
    }
  }
}

export {};
