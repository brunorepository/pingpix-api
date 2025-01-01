import { Request, Response } from 'express';
import Player, { IPlayer } from '../models/player.schema'; // Ajuste o caminho conforme necessário
import moment from 'moment';

// Função para retornar o identificador da imagem de acordo com o título da conquista
const getAchievementImageId = (title: string): string => {
  switch (title) {
    case 'Top 1 Global':
      return 'gold_top1'; // Identificador para a imagem do Top 1
    case 'Top 2 Global':
      return 'silver_top2'; // Identificador para a imagem do Top 2
    case 'Top 3 Global':
      return 'bronze_top3'; // Identificador para a imagem do Top 3
    case 'Faturamento de 10k':
      return 'cash_10k'; // Identificador para a imagem de Faturamento de 10k
    case 'Faturamento de 5k':
      return 'cash_5k'; // Identificador para a imagem de Faturamento de 5k
    case 'Faturamento de 1k':
      return 'cash_1k'; // Identificador para a imagem de Faturamento de 1k
    default:
      return 'default_achievement'; // Identificador para imagens padrão
  }
};

export const getPlayersRanking = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    // Verifique se a data é o último dia do mês à meia-noite
    const isLastDayOfMonth = moment().isSame(
      moment().endOf('month').startOf('day'),
      'second',
    );

    // Função para adicionar conquistas ao jogador
    const addAchievement = async (
      player: IPlayer,
      title: string,
      description: string,
    ): Promise<void> => {
      // Verifica se a conquista já existe para o jogador
      const achievementExists = player.achievements.some(
        (achievement) => achievement.title === title,
      );

      if (achievementExists) {
        // Se a conquista já existe, não adiciona novamente
        return;
      }

      const newAchievement = {
        title,
        description,
        date: new Date(),
        imageId: getAchievementImageId(title), // Adiciona o identificador da imagem
      };

      // Atualiza o jogador com a nova conquista
      player.achievements.push(newAchievement);
      await player.save();
    };

    // Se for o último dia do mês à meia-noite, retorne os top 1, top 2 e top 3 global
    if (isLastDayOfMonth) {
      const topPlayers: IPlayer[] = await Player.find()
        .sort({ balance: -1 }) // Ordena por saldo, do maior para o menor
        .limit(3) // Limita para os 3 primeiros
        .exec();

      if (topPlayers.length > 0) {
        // Adiciona as conquistas de ranking global aos jogadores
        await addAchievement(
          topPlayers[0],
          'Top 1 Global',
          'Conquista pelo 1º lugar no ranking global.',
        );
        await addAchievement(
          topPlayers[1],
          'Top 2 Global',
          'Conquista pelo 2º lugar no ranking global.',
        );
        await addAchievement(
          topPlayers[2],
          'Top 3 Global',
          'Conquista pelo 3º lugar no ranking global.',
        );

        return res.status(200).json({
          top1Global: {
            name: topPlayers[0].name,
            id: topPlayers[0].id,
            balance: topPlayers[0].balance,
            rank: 1,
            achievements: topPlayers[0].achievements.map((achievement) => ({
              title: achievement.title,
              description: achievement.description,
              date: achievement.date,
              imageId: achievement.imageId,
            })),
          },
          top2Global: {
            name: topPlayers[1].name,
            id: topPlayers[1].id,
            balance: topPlayers[1].balance,
            rank: 2,
            achievements: topPlayers[1].achievements.map((achievement) => ({
              title: achievement.title,
              description: achievement.description,
              date: achievement.date,
              imageId: achievement.imageId,
            })),
          },
          top3Global: {
            name: topPlayers[2].name,
            id: topPlayers[2].id,
            balance: topPlayers[2].balance,
            rank: 3,
            achievements: topPlayers[2].achievements.map((achievement) => ({
              title: achievement.title,
              description: achievement.description,
              date: achievement.date,
              imageId: achievement.imageId,
            })),
          },
        });
      }
    }

    // Caso contrário, obtenha os jogadores com paginação normal
    const page: number = parseInt(req.query.page as string, 10) || 1;
    const limit: number = parseInt(req.query.limit as string, 10) || 10;
    const skip: number = (page - 1) * limit;

    // Busca os jogadores ordenados por saldo, com paginação
    const players: IPlayer[] = await Player.find()
      .sort({ balance: -1 }) // Ordena do maior saldo para o menor
      .skip(skip) // Pula os registros anteriores
      .limit(limit) // Limita a quantidade de registros por página
      .exec();

    // Verifica o faturamento dos jogadores e salva as conquistas
    for (const player of players) {
      if (player.balance >= 10000) {
        await addAchievement(
          player,
          'Faturamento de 10k',
          'Conquista por alcançar 10.000 em faturamento.',
        );
      } else if (player.balance >= 5000) {
        await addAchievement(
          player,
          'Faturamento de 5k',
          'Conquista por alcançar 5.000 em faturamento.',
        );
      } else if (player.balance >= 1000) {
        await addAchievement(
          player,
          'Faturamento de 1k',
          'Conquista por alcançar 1.000 em faturamento.',
        );
      }
    }

    // Adiciona a posição de cada jogador
    const playersWithPosition = players.map((player, index) => ({
      ...player.toObject(),
      position: index + 1, // A posição é o índice + 1
      achievements: player.achievements.map((achievement) => ({
        title: achievement.title,
        description: achievement.description,
        date: achievement.date,
        imageId: achievement.imageId, // Garantir que o imageId esteja na resposta
      })),
    }));

    // Conta o total de jogadores para calcular o número total de páginas
    const totalPlayers: number = await Player.countDocuments();

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
