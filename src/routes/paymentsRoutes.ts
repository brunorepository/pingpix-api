import { Router } from 'express';
import { createPixPayment } from '../controllers/paymentsController';

const router = Router();

// Rota para gerar um pagamento
router.post('/payments', createPixPayment);

export default router;
