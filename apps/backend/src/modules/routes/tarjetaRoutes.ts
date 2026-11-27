import { Router } from "express";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import {
  crearTarjeta,
  editarTarjeta,
  eliminarTarjeta,
  listarTarjetas,
  obtenerTarjetaPorId,
} from "../controllers/tarjetaController.js";

const router = Router();

// Todas las rutas requieren sesión iniciada
router.use(authMiddleware);

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
