import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayer extends Document {
  name: string; // Nome do jogador
  id: string; // 11 dígitos
  cpf: string; // Hash do CPF
  dateOfBirth: string; // Formato "DD/MM/YYYY"
  password: string; // Senha do jogador
  email: string; // Email único
  referralCode: string; // Código de indicação de 6 dígitos
  balance: number; // Saldo
  txid?: string | null; // Transação Pix associada ao jogador (opcional)
  resetToken?: string | null; // Permite null
  tokenExpiry?: Date | null; // Permite null
  createdAt?: Date; // Data de criação do documento
  updatedAt?: Date; // Data de atualização do documento
}

const PlayerSchema = new Schema<IPlayer>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    id: {
      type: String,
      required: true,
      unique: true,
      match: /^\d{11}$/, // Exatamente 11 dígitos
    },
    cpf: {
      type: String,
      required: true,
      unique: true,
    },
    dateOfBirth: {
      type: String,
      required: true,
      match: /^\d{2}\/\d{2}\/\d{4}$/, // Formato DD/MM/YYYY
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Validação básica de e-mail
    },
    referralCode: {
      type: String,
      match: /^\w{6}$/, // Exatamente 6 caracteres alfanuméricos
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    txid: {
      type: String,
      default: null,
    },
    resetToken: { type: String, default: null },
    tokenExpiry: { type: Date, default: null },
  },

  {
    timestamps: true, // Adiciona automaticamente createdAt e updatedAt
  },
);

export default mongoose.model<IPlayer>('Player', PlayerSchema);
