import { Router } from "express";
import { authMiddleware, requireAdmin } from "../../middleware/authMiddleware.js";
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} from "../controllers/userController.js";

const router = Router();

// Todas las rutas requieren sesión iniciada
router.use(authMiddleware);

// Crear y listar usuarios es una tarea administrativa:
// el registro público vive en /api/auth/register.
router.post("/", requireAdmin, createUser);
router.get("/", requireAdmin, getUsers);

router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
