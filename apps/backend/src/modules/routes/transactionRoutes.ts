import { Router } from 'express';
import * as transactionController from '../controllers/transactionController.js';

const router = Router();

router.post('/', transactionController.crearTransaccion);
router.get('/', transactionController.listarTransacciones);
router.get('/:id', transactionController.obtenerTransaccion);

export default router;