import { Router } from 'express';
import { getPlayersRanking } from '../controllers/rankingController';
import { asyncHandler } from '../middlewares/asyncHandler'; // Se você definiu o middleware em outro lugar

const router = Router();

// Rota de cadastro
router.get('/ranking', asyncHandler(getPlayersRanking));

export default router;
