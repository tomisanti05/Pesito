import { Router } from "express";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import {
  changePassword,
  forgotPassword,
  login,
  me,
  register,
  resetPassword,
} from "../controllers/authController.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/me", authMiddleware, me);
router.post("/change-password", authMiddleware, changePassword);

export default router;
