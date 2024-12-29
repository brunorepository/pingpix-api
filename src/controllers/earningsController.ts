import { Request, Response } from 'express';
import Gain, { IGain } from '../models/earnings.schema'; // Assumindo que você tem a interface IGain no modelo Gain

// Listar os ganhos recentes de todos os jogadores
export const listAndDeleteRecentGains = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Buscar os ganhos mais recentes (limite de 10)
    const recentGains: IGain[] = await Gain.find()
      .sort({ createdAt: -1 }) // Ordena por data de criação, do mais recente para o mais antigo
      .limit(10) // Limita a 10 resultados
      .populate('playerId', 'name'); // Inclui o nome do jogador associado ao ganho, caso seja necessário

    // Retorna a lista de ganhos recentes
    res.status(200).json({
      message: 'Ganhos recentes listados com sucesso.',
      data: recentGains,
    });

    // Deletar todos os ganhos, exceto os 10 mais recentes
    const idsToDelete = await Gain.find()
      .sort({ createdAt: -1 }) // Ordena por data de criação
      .skip(10) // Pula os 10 primeiros
      .limit(Number.MAX_SAFE_INTEGER) // Limita o número de itens a serem apagados (todos além dos 10 mais recentes)
      .select('_id'); // Retorna apenas os IDs dos documentos para a exclusão

    const ids = idsToDelete.map((gain) => gain._id); // Extrai os IDs dos ganhos a serem deletados
    await Gain.deleteMany({ _id: { $in: ids } }); // Deleta os ganhos com os IDs selecionados
  } catch (error: unknown) {
    console.error('Erro ao listar ganhos recentes:', error);
    if (error instanceof Error) {
      res.status(500).json({
        message: 'Erro ao listar ganhos recentes',
        error: error.message,
      });
    } else {
      res.status(500).json({
        message: 'Erro desconhecido',
        error: 'Erro inesperado ocorreu',
      });
    }
  }
};
