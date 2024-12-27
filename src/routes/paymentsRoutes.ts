import { Router } from 'express';
import {
  addBalanceController,
  createPixPayment,
  subtractBalanceController,
  webhookHandler,
} from '../controllers/paymentsController';

const router = Router();

// Rota para gerar um pagamento
router.post('/payments', createPixPayment);
router.post('/payments/webhook', webhookHandler);
router.post('/payments/subtract-balance', subtractBalanceController);
router.post('/payments/add-balance', addBalanceController);

export default router;
