import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import PlayerSchema from '../models/player.schema';

// Função para gerar um ID de 11 dígitos único
const generateUniqueId = async (): Promise<string> => {
  let id: string;
  let isUnique = false;

  do {
    id = Math.floor(10000000000 + Math.random() * 90000000000).toString();
    const existingPlayer = await PlayerSchema.findOne({ id });
    if (!existingPlayer) {
      isUnique = true;
    }
  } while (!isUnique);

  return id;
};

// Endpoint para registrar usuário
export const registerPlayer = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, cpf, dateOfBirth, password, email, referralCode } = req.body;

    // Verificar duplicidade
    const existingPlayer = await PlayerSchema.findOne({
      $or: [{ email }, { cpf }],
    });
    if (existingPlayer) {
      res.status(400).json({ message: 'Email ou CPF já cadastrados.' });
      return;
    }

    // Gera ID único
    const id = await generateUniqueId();

    // Criptografar senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar jogador
    const newPlayer = new PlayerSchema({
      name,
      id,
      cpf, // CPF armazenado como recebido
      dateOfBirth, // Data de nascimento no formato "DD/MM/YYYY"
      password: hashedPassword,
      email,
      referralCode: referralCode || null, // Armazenar código promocional, se existir
    });

    await newPlayer.save();
    res.status(201).json({ message: 'Jogador cadastrado com sucesso!' });
  } catch (error) {
    console.error('Erro ao cadastrar jogador:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};
