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
    validate: {
      validator: function (v) {
        return /^[a-zA-Z0-9]{6}$/.test(v); // Aceita letras e números, exatamente 6 caracteres
      },
      message: (props) =>
        `${props.value} is not a valid referral code. It must contain exactly 6 alphanumeric characters.`,
    },
    required: [true, 'Referral code is required.'],
  },

  balance: {
    type: Number,
    required: true,
    default: 0,
  },
});

export default mongoose.model<IPlayer>('Player', PlayerSchema);
