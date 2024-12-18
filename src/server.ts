import express from 'express';
import dotenv from 'dotenv';
import connectDatabase from './config/database';
import cors from 'cors';
import registerRoutes from './routes/registerRoutes';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// Configuração do CORS
app.use(
  cors({
    origin: 'http://localhost:5173', // Permitir apenas o frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization'], // Cabeçalhos permitidos
  }),
);

//Conexão com o banco de dados
connectDatabase();

//Routes
app.use('/api/authentication', registerRoutes);

console.log(process.env.DATABASE_LOCATION);

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
