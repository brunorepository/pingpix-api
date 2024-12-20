import { Router } from 'express';
import { getPlayerById } from '../controllers/playerController';

const router = Router();

// Rota para buscar jogador pelo _id
router.get('/player/:id', getPlayerById);

export default router;
