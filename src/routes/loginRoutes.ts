import { Router } from 'express';
import { loginPlayer } from '../controllers/loginController';

const router = Router();

// Rota para buscar jogador pelo _id
router.post('/login', loginPlayer);

export default router;
