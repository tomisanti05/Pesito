import { Router } from 'express';
import * as transactionController from '../controllers/transactionController.js';

const router = Router();

router.post('/', transactionController.crearTransaccion);
router.get('/', transactionController.listarTransacciones);
router.get('/:id', transactionController.obtenerTransaccion);
router.put('/:id', transactionController.editarTransaccion);
router.patch('/:id', transactionController.editarTransaccion);
router.delete('/:id', transactionController.eliminarTransaccion);

export default router;
