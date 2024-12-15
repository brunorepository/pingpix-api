import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayer extends Document {
  name: string;
  id: string; // 11 dígitos
  cpf: string; // Hash do CPF
  dateOfBirth: string; // Formato "DD/MM/YYYY"
  password: string; // Senha do jogador
  email: string; // Email único
  referralCode: string; // Código de indicação de 6 dígitos
  balance: number;
}

const PlayerSchema = new Schema<IPlayer>({
  name: {
    type: String,
    required: true,
  },
  id: {
    type: String,
    required: true,
    unique: true,
    match: /^\d{11}$/,
  },
  cpf: {
    type: String,
    required: true,
    unique: true,
  },
  dateOfBirth: {
    type: String,
    required: true,
    match: /^\d{2}\/\d{2}\/\d{4}$/,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  referralCode: {
    type: String,
    match: /^\d{6}$/,
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
  },
});

export default mongoose.model<IPlayer>('Player', PlayerSchema);
