import { Router } from "express";
import * as boletaController from "../controllers/boletaController.js";

const router = Router();

router.get("/", boletaController.listarBoletas);
router.post("/", boletaController.crearBoleta);
router.get("/:id", boletaController.obtenerBoleta);
router.put("/:id", boletaController.editarBoleta);
router.patch("/:id", boletaController.editarBoleta);
router.delete("/:id", boletaController.eliminarBoleta);

export default router;
