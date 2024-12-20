import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; // Importa a biblioteca para gerar tokens
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

// Endpoint para registrar jogador
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

    // Gerar token JWT
    const token = jwt.sign(
      {
        id: newPlayer._id, // Substitui o ID do token para usar o _id do MongoDB
        email: newPlayer.email,
        name: newPlayer.name,
      },
      process.env.JWT_SECRET ||
        'd9bf28925a16501f74e9fe86f21a7afa93b576bfd0a8e89db5542dfd21b89db242fe2ef4aeed8b8a81651a59b6ac84e23fc8485f9cd3e4678b01ae29eee222d0', // Substituir por uma variável de ambiente segura
      { expiresIn: '1h' }, // Expiração do token (1 hora)
    );

    res.status(201).json({
      message: 'Jogador cadastrado com sucesso!',
      token, // Retorna o token na resposta
      player: {
        _id: newPlayer._id,
        name: newPlayer.name,
      },
    });
  } catch (error) {
    console.error('Erro ao cadastrar jogador:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
};
