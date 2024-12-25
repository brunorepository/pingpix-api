import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws'; // Importa WebSocket nativo
import cors from 'cors';
import connectDatabase from './config/database';
import registerRoutes from './routes/registerRoutes';
import playerRoutes from './routes/playerRoutes';
import loginRoutes from './routes/loginRoutes';
import recoveryPasswordRoutes from './routes/recoveryPasswordRoutes';
import paymentsRoutes from './routes/paymentsRoutes';
import { registerWebhook } from './controllers/paymentsController';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server }); // Configura o WebSocketServer

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

  // Adiciona o cliente conectado ao conjunto de clientes
  clients.add(ws);

  ws.on('message', (message) => {
    console.log('Mensagem recebida do cliente:', message.toString());
  });

  ws.on('close', () => {
    console.log('Cliente desconectado.');
    clients.delete(ws); // Remove o cliente ao desconectar
  });

  ws.on('error', (error) => {
    console.error('Erro na conexão WebSocket:', error);
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

// Inicia o servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Exporta o WebSocketServer e o conjunto de clientes para uso externo
export { wss, clients };
