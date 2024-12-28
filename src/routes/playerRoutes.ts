import { Router } from 'express';
import { getPlayerById, getProfileById } from '../controllers/playerController';

const router = Router();

// Rota para buscar jogador pelo _id
router.get('/player/:id', getPlayerById);
router.get('/player/profile/:id', getProfileById);

export default router;
