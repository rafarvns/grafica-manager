import 'dotenv/config';
import express from 'express';
import { getEnv } from '@/infrastructure/config/env';
import { authMiddleware } from '@/infrastructure/http/middlewares/auth.middleware';

async function bootstrap() {
  try {
    const env = getEnv();
    console.log(`[ENV] Variáveis de ambiente carregadas com sucesso`);

    const app = express();
    app.use(express.json());

    app.get('/health', (_req, res) => {
      res.status(200).json({ status: 'ok', uptime: process.uptime() });
    });

    const protectedRouter = express.Router();
    protectedRouter.use(authMiddleware(() => env.API_TOKEN));

    app.use('/api/v1', protectedRouter);

    const server = app.listen(env.PORT, () => {
      console.log(`[SERVER] Servidor ouvindo na porta ${env.PORT}`);
    });

    process.on('SIGTERM', () => {
      console.log('[SERVER] SIGTERM recebido, encerrando...');
      server.close(() => {
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('[SERVER] SIGINT recebido, encerrando...');
      server.close(() => {
        process.exit(0);
      });
    });

    return { app, server };
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[BOOTSTRAP] Erro na inicialização:`, error.message);
    } else {
      console.error(`[BOOTSTRAP] Erro na inicialização:`, error);
    }
    process.exit(1);
  }
}

bootstrap();
