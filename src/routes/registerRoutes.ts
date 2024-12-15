import { Router } from 'express';
import { registerPlayer } from '../controllers/registerController';

const router = Router();

// Rota de cadastro
router.post('/register', registerPlayer);

export default router;
