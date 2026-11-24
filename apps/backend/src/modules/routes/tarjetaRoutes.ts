import { Router } from "express";
import {
  crearTarjeta,
  editarTarjeta,
  eliminarTarjeta,
  listarTarjetas,
  obtenerTarjetaPorId,
} from "../controllers/tarjetaController.js";

const router = Router();

// GET /api/v1/tarjetas -> Listado paginado
router.get("/", listarTarjetas);

// POST /api/v1/tarjetas
router.post("/", crearTarjeta);

// GET /api/v1/tarjetas/:id
router.get("/:id", obtenerTarjetaPorId);

// PUT/PATCH /api/v1/tarjetas/:id
router.put("/:id", editarTarjeta);
router.patch("/:id", editarTarjeta);

// DELETE /api/v1/tarjetas/:id
router.delete("/:id", eliminarTarjeta);

export default router;
