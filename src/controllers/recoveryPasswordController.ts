import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Player from '../models/player.schema'; // Modelo de jogador
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';

export const sendPasswordResetLink = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email } = req.body;

  try {
    // Verifica se o jogador existe no banco de dados
    const player = await Player.findOne({ email });
    if (!player) {
      res.status(404).json({ message: 'Usuário não encontrado.' });
      return; // Encerra a execução da função
    }

    // Gera o token de redefinição de senha
    const resetToken = uuidv4();

    // Cria o link de redefinição de senha
    const resetLink = `${process.env.FRONT_URL}/change-password?token=${resetToken}&email=${email}`;

    // Configura o transportador de e-mail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Configuração do e-mail
    const mailOptions = {
      from: `"PingPix" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Redefinição de Senha - PingPix',
      html: `
        <div style="font-family: Arial, background-color: #035faf; sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background-color: #004d91; padding: 20px; text-align: left;">
            <h1 style="color: #ffffff; font-size: 28px; margin: 0;">PingPix</h1>
            <p style="color: #ffffff; font-size: 18px; margin: 5px 0;">Redefinição de Senha</p>
          </div>
          <!-- Body -->
          <div style="padding: 25px; background-color: #035faf;">
            <h2 style="color: #00f12c; font-size: 22px;">Olá!</h2>
            <p style="color: #ffff; font-size: 16px; line-height: 1.6;">
              Recebemos uma solicitação para redefinir a senha da sua conta no <strong>PingPix</strong>.
              Clique no botão abaixo para redefinir sua senha:
            </p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${resetLink}" target="_blank" style="display: inline-block; background-color: #00f12c; color: #ffffff; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-size: 18px; font-weight: bold;">Redefinir Senha</a>
            </div>
            <p style="color: #ffff; font-size: 16px; line-height: 1.6;">
              Ou copie e cole o link abaixo no seu navegador:
            </p>
            <p style="word-break: break-word; background-color: #004d91; padding: 10px; border-radius: 5px; font-size: 16px;">
              <a href="${resetLink}" target="_blank" style="color: #00f12c; text-decoration: none;">${resetLink}</a>
            </p>
            <p style="color: #ffff; font-size: 14px; margin-top: 20px;">
              Este link é válido por 1 hora. Caso você não tenha solicitado a redefinição de senha, ignore este e-mail.
            </p>
          </div>
          <!-- Footer -->
          <div style="background-color: #004d91; padding: 15px; text-align: center; font-size: 14px; color: #ffffff;">
            <p style="margin: 0;">© PingPix.net. Todos os direitos reservados.</p>
            <p style="margin: 5px 0;">
              <a href="https://pingpix.net" style="color: #00f12c; text-decoration: none;">Visite nosso site</a>
            </p>
          </div>
        </div>
      `,
    };

    // Envia o e-mail
    await transporter.sendMail(mailOptions);

    // Salva o token e sua validade no banco de dados
    player.resetToken = resetToken;
    player.tokenExpiry = new Date(Date.now() + 3600000); // Converte para Date
    await player.save();

    // Responde com sucesso
    res.status(200).json({ message: 'Link de redefinição de senha enviado.' });
  } catch (error) {
    console.error('Erro ao enviar link de redefinição de senha:', error);
    res.status(500).json({
      message: 'Erro ao enviar link de redefinição de senha.',
    });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { token, email, newPassword } = req.body;

  try {
    // Verifica se o usuário existe no banco de dados
    const player = await Player.findOne({ email, resetToken: token });

    if (!player) {
      res.status(404).json({ message: 'Token ou usuário inválido.' });
      return;
    }

    // Verifica se o token expirou
    if (!player.tokenExpiry || player.tokenExpiry < new Date()) {
      res.status(400).json({
        message: 'O token expirou. Solicite uma nova redefinição de senha.',
      });
      return;
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualiza a senha e remove o token
    player.password = hashedPassword;
    player.resetToken = null;
    player.tokenExpiry = null;
    await player.save();

    res.status(200).json({ message: 'Senha alterada com sucesso!' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({
      message: 'Erro ao redefinir senha. Tente novamente mais tarde.',
    });
  }
};
