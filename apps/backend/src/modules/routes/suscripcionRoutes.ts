import { Router } from "express";
import {
    listarSuscripciones,
    crearSuscripcion,
    obtenerSuscripcionPorId,
    editarSuscripcion,
    eliminarSuscripcion,
} from "../controllers/suscripcionController.js";

const router = Router();

// GET /api/v1/suscripciones -> Listado paginado
router.get("/", listarSuscripciones);

// POST /api/v1/suscripciones
router.post("/", crearSuscripcion);

// GET /api/v1/suscripciones/:id
router.get("/:id", obtenerSuscripcionPorId);

// PUT/PATCH /api/v1/suscripciones/:id
router.put("/:id", editarSuscripcion);
router.patch("/:id", editarSuscripcion);

// DELETE /api/v1/suscripciones/:id
router.delete("/:id", eliminarSuscripcion);

export default router;
