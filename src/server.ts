import express from 'express';
import dotenv from 'dotenv';
import connectDatabase from './config/database';

import registerRoutes from './routes/registerRoutes';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

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
