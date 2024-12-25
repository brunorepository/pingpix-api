/* eslint-disable @typescript-eslint/no-unused-vars */
import https from 'https';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import appRootPath from 'app-root-path';
import { Request, Response } from 'express';
import User from '../models/player.schema';
import { clients } from '../server';

// Carrega variáveis de ambiente
dotenv.config();

const certificadoPath = path.resolve(appRootPath.path, 'producao.p12');
let certificado: Buffer;
try {
  certificado = fs.readFileSync(certificadoPath);
  console.log('Certificado carregado com sucesso.');
} catch (error) {
  console.error('Certificado não encontrado:', certificadoPath);
  throw new Error('Certificado ausente. Adicione o arquivo na pasta correta.');
}

const credenciais = {
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
};

if (!credenciais.client_id || !credenciais.client_secret) {
  console.error('CLIENT_ID ou CLIENT_SECRET ausente.');
  process.exit(1);
}

const getAccessToken = async (): Promise<string> => {
  try {
    const auth = Buffer.from(
      `${credenciais.client_id}:${credenciais.client_secret}`,
    ).toString('base64');

    const agent = new https.Agent({
      pfx: certificado,
      passphrase: '',
    });

    const data = JSON.stringify({ grant_type: 'client_credentials' });

    const config: AxiosRequestConfig = {
      method: 'POST',
      url: `${process.env.EFI_PROD_SERVER}/oauth/token`,
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      httpsAgent: agent,
      data: data,
    };

    const response: AxiosResponse<{ access_token: string }> =
      await axios(config);
    return response.data.access_token;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Erro ao buscar access token:', error.message);
    throw new Error('Erro ao buscar access token.');
  }
};

export const registerWebhook = async (): Promise<void> => {
  try {
    const accessToken: string = await getAccessToken();

    const agent: https.Agent = new https.Agent({
      pfx: certificado,
      passphrase: '',
    });

    let webhookUrl: string | undefined = process.env.WEBHOOK_URL;

    // Valida o formato da URL
    if (!webhookUrl || !/^https?:\/\/[^\s]+$/.test(webhookUrl)) {
      throw new Error('URL do webhook inválida. Verifique o arquivo .env.');
    }

    // Adiciona o parâmetro ignorar=true
    webhookUrl = `${webhookUrl}?ignorar=true`;

    const config: AxiosRequestConfig = {
      method: 'PUT',
      url: `https://pix.api.efipay.com.br/v2/webhook/${process.env.EB_PIX_KEY}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-skip-mtls-checking': 'true', // Adiciona o cabeçalho
      },
      httpsAgent: agent,
      data: JSON.stringify({ webhookUrl }),
    };

    const response: AxiosResponse = await axios(config);

    if (response.status === 200) {
      console.log('Webhook registrado com sucesso:', response.data);
    } else {
      console.error(
        'Webhook não registrado. Código de status inesperado:',
        response.status,
        response.data,
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.response) {
      console.error(
        'Erro ao registrar o webhook:',
        error.response.data,
        'Status:',
        error.response.status,
      );
    } else if (error.request) {
      console.error(
        'Erro na requisição ao registrar o webhook:',
        error.request,
      );
    } else {
      console.error('Erro inesperado ao registrar o webhook:', error.message);
    }
  }
};

export const createPixPayment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { value, payerName, payerCpf, userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'O ID do usuário é obrigatório.' });
      return;
    }

    const accessToken = await getAccessToken();

    const chargeInput = {
      calendario: { expiracao: 3600 },
      devedor: { cpf: payerCpf, nome: payerName },
      valor: { original: parseFloat(value).toFixed(2) },
      chave: process.env.EB_PIX_KEY,
      solicitacaoPagador: process.env.PAYMENT_DESCRIPTION,
    };

    const agent = new https.Agent({
      pfx: certificado,
      passphrase: '',
    });

    const createChargeConfig: AxiosRequestConfig = {
      method: 'POST',
      url: `${process.env.EFI_PROD_SERVER}/v2/cob`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      httpsAgent: agent,
      data: JSON.stringify(chargeInput),
    };

    const chargeResponse = await axios(createChargeConfig);
    const locId = chargeResponse.data.loc.id;
    const txid = chargeResponse.data.txid;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }

    user.txid = txid;
    await user.save();

    const qrCodeConfig: AxiosRequestConfig = {
      method: 'GET',
      url: `${process.env.EFI_PROD_SERVER}/v2/loc/${locId}/qrcode`,
      headers: { Authorization: `Bearer ${accessToken}` },
      httpsAgent: agent,
    };

    const qrcodeResponse = await axios(qrCodeConfig);

    res.status(200).json({
      txid,
      qrCodeImage: qrcodeResponse.data.imagemQrcode,
      qrCodeText: qrcodeResponse.data.qrcode,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Erro ao criar cobrança Pix:', error.message);
    res.status(500).json({ error: 'Erro ao criar cobrança Pix.' });
  }
};

export const webhookHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { pix } = req.body;

    if (!pix || !Array.isArray(pix) || pix.length === 0) {
      console.log('Notificação de teste recebida ou sem transações Pix.');
      res
        .status(200)
        .json({ message: 'Webhook de teste recebido com sucesso.' });
      return;
    }

    console.log(`Recebendo ${pix.length} transação(ões) para processamento.`);

    for (const transaction of pix) {
      const { txid, valor } = transaction;

      if (!txid || !valor) {
        console.error('Dados da transação Pix incompletos:', transaction);
        continue;
      }

      const user = await User.findOne({ txid });
      if (!user) {
        console.error(`Usuário não encontrado para o txid: ${txid}`);
        continue;
      }

      user.balance += parseFloat(valor);
      user.txid = null;
      await user.save();

      console.log(
        `Saldo do usuário ${user.name} atualizado para: R$${user.balance.toFixed(2)}`,
      );

      // Envia uma mensagem via WebSocket para notificar o cliente
      const message = JSON.stringify({
        type: 'paymentReceived',
        userId: user._id,
        amount: parseFloat(valor),
      });

      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }

    res.status(201).json({ message: 'Transações processadas com sucesso.' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Erro ao processar webhook:', error.message);
    res.status(500).json({ error: 'Erro ao processar notificações Pix.' });
  }
};
