import { Router } from "express";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import * as boletaController from "../controllers/boletaController.js";

const router = Router();

// Todas las rutas requieren sesión iniciada
router.use(authMiddleware);

router.get("/", boletaController.listarBoletas);
router.post("/", boletaController.crearBoleta);
router.get("/:id", boletaController.obtenerBoleta);
router.put("/:id", boletaController.editarBoleta);
router.patch("/:id", boletaController.editarBoleta);
router.delete("/:id", boletaController.eliminarBoleta);

export default router;
