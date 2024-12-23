/* eslint-disable @typescript-eslint/no-unused-vars */
import https from 'https';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import appRootPath from 'app-root-path';
import { Request, Response } from 'express';
import User from '../models/player.schema'; // Update the path based on your project structure

// Load environment variables
dotenv.config();

const certificadoPath = path.resolve(appRootPath.path, 'producao.p12');
console.log('Certificate Path:', certificadoPath);

let certificado: Buffer;
try {
  certificado = fs.readFileSync(certificadoPath);
  console.log('Certificate loaded successfully.');
} catch (error) {
  console.error('Certificate file not found:', certificadoPath);
  throw new Error(
    'Certificate file is missing. Please add it to the correct path.',
  );
}

const credenciais = {
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
};

if (!credenciais.client_id || !credenciais.client_secret) {
  console.error(
    'CLIENT_ID or CLIENT_SECRET is missing.' +
      JSON.stringify(credenciais.client_id),
  );
  process.exit(1);
}

console.log('CLIENT_ID:', credenciais.client_id);
console.log('CLIENT_SECRET:', credenciais.client_secret);

// Function to fetch the access token
export const getAccessToken = async (): Promise<string> => {
  try {
    const auth = Buffer.from(
      `${credenciais.client_id}:${credenciais.client_secret}`,
    ).toString('base64');

    console.log('Authorization Header:', `Basic ${auth}`);

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

    console.log('Access Token Request Config:', config);

    const response: AxiosResponse<{ access_token: string }> =
      await axios(config);

    console.log('Access Token:', response.data.access_token);
    return response.data.access_token;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(
      'Error fetching access token:',
      error.response?.data || error.message,
    );
    throw new Error('Failed to fetch access token');
  }
};

// Function to create a Pix payment
export const createPixPayment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { value, payerName, payerCpf, userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'O _id do usuário é obrigatório.' });
      return;
    }

    // Obtain the access token
    const accessToken = await getAccessToken();

    const chargeInput = {
      calendario: {
        expiracao: 3600, // Expires in 1 hour
      },
      devedor: {
        cpf: payerCpf,
        nome: payerName,
      },
      valor: {
        original: parseFloat(value).toFixed(2), // Charge value
      },
      chave: process.env.EB_PIX_KEY, // Replace with your registered Pix key
      solicitacaoPagador: process.env.PAYMENT_DESCRIPTION,
    };

    const agent = new https.Agent({
      pfx: certificado,
      passphrase: '',
    });

    // Create Pix charge
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

    // Associate the txid with the user in the database
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }

    user.txid = txid; // Save the txid associated with the payment
    await user.save();

    // Generate the QR Code
    const qrCodeConfig: AxiosRequestConfig = {
      method: 'GET',
      url: `${process.env.EFI_PROD_SERVER}/v2/loc/${locId}/qrcode`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      httpsAgent: agent,
    };

    const qrcodeResponse = await axios(qrCodeConfig);

    res.status(200).json({
      txid: txid,
      qrCodeImage: qrcodeResponse.data.imagemQrcode,
      qrCodeText: qrcodeResponse.data.qrcode,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error(
      'Erro ao gerar a cobrança Pix:',
      error.response?.data || error.message,
    );
    res.status(500).json({ error: 'Erro ao gerar cobrança Pix.' });
  }
};
