import { Router } from "express";
import {
    listarBilleteras,
    crearBilletera,
    obtenerBilleteraPorId,
    editarBilletera,
    eliminarBilletera,
} from "../controllers/billeteraController.js";

const router = Router();

// GET /api/v1/billeteras -> Listado paginado
router.get("/", listarBilleteras);

// POST /api/v1/billeteras
router.post("/", crearBilletera);

// GET /api/v1/billeteras/:id
router.get("/:id", obtenerBilleteraPorId);

// PUT/PATCH /api/v1/billeteras/:id
router.put("/:id", editarBilletera);
router.patch("/:id", editarBilletera);

// DELETE /api/v1/billeteras/:id
router.delete("/:id", eliminarBilletera);

export default router;
