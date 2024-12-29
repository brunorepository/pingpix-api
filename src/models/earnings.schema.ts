// src/models/gain.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IGain extends Document {
  playerId: string; // ID do jogador
  playerName: string; // Nome do jogador
  amount: number; // Valor do ganho
  createdAt: Date; // Hora do ganho
}

const GainSchema = new Schema<IGain>(
  {
    playerId: {
      type: String,
      required: true,
      ref: 'Player', // Relacionamento com o modelo Player
    },
    playerName: {
      type: String,
      required: true, // Agora o nome do jogador é obrigatório
    },
    amount: {
      type: Number,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now, // A hora do ganho será registrada automaticamente
    },
  },
  {
    timestamps: true, // Adiciona createdAt e updatedAt automaticamente
  },
);

export default mongoose.model<IGain>('Gain', GainSchema);
