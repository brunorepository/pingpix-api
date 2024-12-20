import { Request, Response } from 'express';
import PlayerSchema from '../models/player.schema';

export const getPlayerById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    // Verifica se o ID foi fornecido
    if (!id) {
      res.status(400).json({ message: 'O ID do jogador é obrigatório.' });
      return;
    }

    // Busca o jogador no banco de dados
    const player = await PlayerSchema.findById(id).select('-password'); // Exclui a senha do retorno

    if (!player) {
      res.status(404).json({ message: 'Jogador não encontrado.' });
      return;
    }

    res.status(200).json(player); // Retorna as informações do jogador
  } catch (error) {
    console.error('Erro ao buscar jogador:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};
