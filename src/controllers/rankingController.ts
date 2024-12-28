import { Request, Response } from 'express';
import Player, { IPlayer } from '../models/player.schema'; // Ajuste o caminho conforme necessário

export const getPlayersRanking = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    // Obter parâmetros de consulta (page e limit)
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Busca os jogadores ordenados por saldo, com paginação
    const players: IPlayer[] = await Player.find()
      .sort({ balance: -1 }) // Ordena do maior saldo para o menor
      .skip(skip) // Pula os registros anteriores
      .limit(limit) // Limita a quantidade de registros por página
      .exec();

    // Adiciona a posição de cada jogador
    const playersWithPosition = players.map((player, index) => ({
      ...player.toObject(),
      position: index + 1, // A posição é o índice + 1
    }));

    // Conta o total de jogadores para calcular o número total de páginas
    const totalPlayers = await Player.countDocuments();

    return res.status(200).json({
      players: playersWithPosition,
      totalPlayers,
      totalPages: Math.ceil(totalPlayers / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Erro ao buscar jogadores:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
