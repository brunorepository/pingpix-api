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

export const getProfileById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    // Valida o ID fornecido
    if (!id) {
      res.status(400).json({ message: 'O ID do perfil é obrigatório.' });
      return;
    }

    // Consulta no banco de dados para buscar o perfil pelo campo `id`
    const profile = await PlayerSchema.findOne({ id }).select('-password'); // Exclui o campo de senha do retorno

    if (!profile) {
      res.status(404).json({ message: 'Perfil não encontrado.' });
      return;
    }

    res.status(200).json(profile); // Retorna o perfil encontrado
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};
