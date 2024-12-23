import express from 'express';
import dotenv from 'dotenv';
import connectDatabase from './config/database';
import cors from 'cors';
import registerRoutes from './routes/registerRoutes';
import playerRoutes from './routes/playerRoutes';
import loginRoutes from './routes/loginRoutes';
import recoveryPasswordRoutes from './routes/recoveryPasswordRoutes';
import paymentsRoutes from './routes/paymentsRoutes';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// Configuração do CORS
app.use(
  cors({
    // origin: process.env.FRONT_URL || 'http://localhost:5173', // Permitir apenas o frontend
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization'], // Cabeçalhos permitidos
  }),
);

//Conexão com o banco de dados
connectDatabase();

//Routes
app.use('/api/authentication', registerRoutes);
app.use('/api/authentication', loginRoutes);
app.use('/api/authentication', recoveryPasswordRoutes);
app.use('/api/', playerRoutes);
app.use('/api', paymentsRoutes);

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
