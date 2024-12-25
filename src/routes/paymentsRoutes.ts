import { Router } from 'express';
import {
  createPixPayment,
  webhookHandler,
} from '../controllers/paymentsController';

const router = Router();

// Rota para gerar um pagamento
router.post('/payments', createPixPayment);
router.post('/payments/webhook', webhookHandler);

export default router;
