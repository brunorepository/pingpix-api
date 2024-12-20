import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import PlayerSchema from '../models/player.schema';

// Função de login
export const loginPlayer = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Verifica se o email foi fornecido
    if (!email || !password) {
      res.status(400).json({ message: 'Email e senha são obrigatórios.' });
      return;
    }

    // Verifica se o jogador existe
    const player = await PlayerSchema.findOne({ email });
    if (!player) {
      res.status(404).json({ message: 'Jogador não encontrado.' });
      return;
    }

    // Compara a senha fornecida com a senha armazenada
    const isPasswordValid = await bcrypt.compare(password, player.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Senha incorreta.' });
      return;
    }

    // Gera o token JWT
    const token = jwt.sign(
      {
        id: player._id,
        email: player.email,
        name: player.name,
      },
      process.env.JWT_SECRET ||
        'd9bf28925a16501f74e9fe86f21a7afa93b576bfd0a8e89db5542dfd21b89db242fe2ef4aeed8b8a81651a59b6ac84e23fc8485f9cd3e4678b01ae29eee222d0', // Substituir pela variável de ambiente segura
      { expiresIn: '1h' }, // Token expira em 1 hora
    );

    // Responde com o token e dados do jogador
    res.status(200).json({
      message: 'Login realizado com sucesso!',
      token,
      player: {
        _id: player._id,
        name: player.name,
        email: player.email,
      },
    });
  } catch (error) {
    console.error('Erro ao realizar login:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};
