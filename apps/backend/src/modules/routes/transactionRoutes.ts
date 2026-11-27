import { Router } from 'express';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import * as transactionController from '../controllers/transactionController.js';

const router = Router();

// Todas las rutas requieren sesión iniciada
router.use(authMiddleware);

router.post('/', transactionController.crearTransaccion);
router.get('/', transactionController.listarTransacciones);
router.get('/:id', transactionController.obtenerTransaccion);
router.put('/:id', transactionController.editarTransaccion);
router.patch('/:id', transactionController.editarTransaccion);
router.delete('/:id', transactionController.eliminarTransaccion);

export default router;
