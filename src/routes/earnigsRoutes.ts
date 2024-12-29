// src/routes/gainsRoutes.ts
import express from 'express';
import { listAndDeleteRecentGains } from '../controllers/earningsController';

const router = express.Router();

// Rota para listar os ganhos recentes
router.get('/gains/recents', listAndDeleteRecentGains);

export default router;
