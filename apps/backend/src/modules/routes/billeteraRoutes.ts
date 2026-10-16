import { Router } from "express";
import {
    crearBilletera,
    obtenerBilleteraPorId,
    editarBilletera
} from "../controllers/billeteraController.js"; 

const router = Router();

// POST /api/wallets
router.post("/", crearBilletera);

// GET /api/wallets/:id
router.get("/:id", obtenerBilleteraPorId);

// PUT /api/wallets/:id
router.put("/:id", editarBilletera);

export default router;