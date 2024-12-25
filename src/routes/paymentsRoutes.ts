import { Router } from 'express';
import { Server } from 'socket.io'; // Importação do Socket.IO
import {
  createPixPayment,
  webhookHandler,
} from '../controllers/paymentsController';

const router = Router();

// Inicialize a função `webhookHandler` com o Socket.IO
export default (io: Server) => {
  // Rota para gerar um pagamento
  router.post('/payments', createPixPayment);
  router.post('/payments/webhook', webhookHandler(io)); // Passa o `io` para inicializar o handler

  return router;
};
