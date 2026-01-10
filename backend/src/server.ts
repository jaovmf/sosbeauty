import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import mongoose from 'mongoose';
import { connectMongoDB } from './database/mongodb';
import { startKeepAlive, stopKeepAlive } from './utils/keepAlive';

import authRoutes from './routes/auth';
import usuariosRoutes from './routes/usuarios';
import produtosRoutes from './routes/produtos';
import clientesRoutes from './routes/clientes';
import vendasRoutes from './routes/vendas';
import relatoriosRoutes from './routes/relatorios';
import fornecedoresRoutes from './routes/fornecedores';
import entradasRoutes from './routes/entradas';

const app = express();
const PORT = Number(process.env.PORT) || 3003;

// Conectar ao MongoDB antes de iniciar o servidor
connectMongoDB().catch((err) => {
  console.error('❌ Falha ao conectar ao MongoDB:', err);
  process.exit(1);
});

app.use(helmet());

// Configurar CORS dinamicamente baseado em variável de ambiente
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : [
      'http://localhost:5173',
      'http://192.168.1.7:5173',
      'http://192.168.1.9:5173',
      'http://127.0.0.1:5173',
    ];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  '/uploads',
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
  express.static(path.join(__dirname, '../uploads'))
);

// Rotas públicas
app.use('/api/auth', authRoutes);

// Rotas protegidas
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/vendas', vendasRoutes);
app.use('/api/relatorios', relatoriosRoutes);
app.use('/api/fornecedores', fornecedoresRoutes);
app.use('/api/entradas', entradasRoutes);

app.get('/api/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      type: 'MongoDB',
      status: mongoStatus,
      name: mongoose.connection.name
    }
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 API disponível em:`);
  console.log(`   - http://localhost:${PORT}/api`);
  console.log(`   - http://192.168.1.7:${PORT}/api`);
  console.log(`   - http://192.168.1.9:${PORT}/api`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🍃 Database: MongoDB`);

  // Iniciar keep-alive para evitar sleep no Render (plano free)
  startKeepAlive(PORT);
});

process.on('SIGTERM', async () => {
  console.log('📴 Recebido SIGTERM, fechando servidor...');
  stopKeepAlive();
  server.close(async () => {
    console.log('✅ Servidor fechado');
    await mongoose.connection.close();
    console.log('✅ MongoDB desconectado');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('📴 Recebido SIGINT, fechando servidor...');
  stopKeepAlive();
  server.close(async () => {
    console.log('✅ Servidor fechado');
    await mongoose.connection.close();
    console.log('✅ MongoDB desconectado');
    process.exit(0);
  });
});

export default app;
