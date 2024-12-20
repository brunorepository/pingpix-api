import express from 'express';
import {
  resetPassword,
  sendPasswordResetLink,
} from '../controllers/recoveryPasswordController';

const router = express.Router();

// Rota para envio do link de recuperação de senha
router.post('/forgot-password', sendPasswordResetLink);

// Rota para redefinir senha com base no token
router.post('/reset-password', resetPassword);

export default router;
