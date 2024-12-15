import mongoose from 'mongoose';

const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.DATABASE_LOCATION;

    if (!mongoUri) {
      throw new Error('A variável de ambiente MONGO_URI não está definida.');
    }

    await mongoose.connect(mongoUri);

    console.log('Conectado ao MongoDB com sucesso!');
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
    process.exit(1); // Finaliza o processo em caso de erro crítico
  }
};

export default connectDatabase;
