import express, { type NextFunction, type Request, type Response } from "express";
import { connectDatabase } from "./config/database.js";
import userRoutes from "./modules/routes/userRoutes.js";
import transactionRoutes from "./modules/routes/transactionRoutes.js";
import billeteraRoutes from "./modules/routes/billeteraRoutes.js"
const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.send("servidor corriendo");
});

async function conectarBase(_req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    next(error);
  }
}

app.use("/api/users", conectarBase, userRoutes);
app.use("/api/transactions", conectarBase, transactionRoutes);
app.use("/api/billetera",conectarBase, billeteraRoutes);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[app] error no controlado:", error);
  res.status(500).json({ mensaje: "Error interno del servidor." });
});

export default app;