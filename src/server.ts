import express from 'express';
import dotenv from 'dotenv';
import connectDatabase from './config/database';
import cors from 'cors';
import registerRoutes from './routes/registerRoutes';
import playerRoutes from './routes/playerRoutes';
import loginRoutes from './routes/loginRoutes';
import recoveryPasswordRoutes from './routes/recoveryPasswordRoutes';
import paymentsRoutes from './routes/paymentsRoutes';
import { registerWebhook } from './controllers/paymentsController';
import http from 'http';
import { Server } from 'socket.io';

dotenv.config();

// Criação do app e servidor HTTP
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Permite o acesso do frontend (ajuste conforme necessário)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Métodos permitidos
  },
});

// Middleware
app.use(express.json());

// Configuração do CORS
app.use(
  cors({
    origin: '*', // Permitir apenas o frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization'], // Cabeçalhos permitidos
  }),
);

// Conexão com o banco de dados
connectDatabase();

// Configura o Socket.IO no app
app.set('io', io);

// Registro do webhook
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
  console.log(`Server is running on port ${PORT}`);
});
