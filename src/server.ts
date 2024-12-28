import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import { WebSocketServer, WebSocket, RawData } from 'ws'; // Importa RawData para tipar mensagens
import cors from 'cors';
import connectDatabase from './config/database';
import registerRoutes from './routes/registerRoutes';
import playerRoutes from './routes/playerRoutes';
import loginRoutes from './routes/loginRoutes';
import recoveryPasswordRoutes from './routes/recoveryPasswordRoutes';
import paymentsRoutes from './routes/paymentsRoutes';
import rankingRoutes from './routes/rankingRoutes';

import EarningsWebSocketService from './services/earnings.ws';

import { registerWebhook } from './controllers/paymentsController';

dotenv.config();

const app = express();
const server = http.createServer(app); // Servidor HTTP
const wss = new WebSocketServer({ noServer: true }); // WebSocketServer com noServer: true

// Middleware
app.use(express.json());

// Configuração do CORS
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Conexão com o banco de dados
connectDatabase();

// Gerenciamento de conexões WebSocket
const clients = new Set<WebSocket>();

wss.on('connection', (ws: WebSocket) => {
  console.log('Cliente conectado ao WebSocket.');

  // Adiciona o cliente ao conjunto de clientes
  clients.add(ws);

  // Lida com mensagens recebidas
  ws.on('message', (message: RawData) => {
    const messageText = message.toString(); // Converte o RawData para string
    console.log('Mensagem recebida do cliente:', messageText);
  });

  // Lida com o fechamento da conexão
  ws.on('close', () => {
    console.log('Cliente desconectado.');
    clients.delete(ws); // Remove o cliente ao desconectar
  });

  // Lida com erros na conexão
  ws.on('error', (error: Error) => {
    console.error('Erro na conexão WebSocket:', error.message);
  });
});

// Registrar o webhook
registerWebhook();

// Rotas
app.use('/api/authentication', registerRoutes);
app.use('/api/authentication', loginRoutes);
app.use('/api/authentication', recoveryPasswordRoutes);
app.use('/api/', playerRoutes);
app.use('/api', paymentsRoutes);
app.use('/api', rankingRoutes);

// Inicializa o serviço WebSocket
EarningsWebSocketService.initialize(server);

// Inicia o servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Exporta o WebSocketServer e o conjunto de clientes para uso externo
export { wss, clients };
