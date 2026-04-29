import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { getEnv } from '@/infrastructure/config/env';
import { authMiddleware } from '@/infrastructure/http/middlewares/auth.middleware';
import { createMetricsRouter } from '@/infrastructure/http/routes/metrics.routes';
import { createReportsRouter } from '@/infrastructure/http/routes/reports.routes';
import { createCustomersRouter } from '@/infrastructure/http/routes/customers.routes';
import { createOrdersRouter } from '@/infrastructure/http/routes/orders.routes';
import { createPrintJobsRouter } from '@/infrastructure/http/routes/print-jobs.routes';
import { createSettingsRouter } from '@/infrastructure/http/routes/settings.routes';
import { createSystemSettingsRouter } from '@/infrastructure/http/routes/system-settings.routes';
import { createNotificationsRouter } from '@/infrastructure/http/routes/notifications.routes';
import { setupRetentionCleanup } from '@/infrastructure/jobs/RetentionCleanupJob';
import { setupNotificationCleanup } from '@/infrastructure/jobs/NotificationCleanupJob';
import IORedis from 'ioredis';

async function bootstrap() {
  try {
    const env = getEnv();
    const prisma = new PrismaClient();
    console.log(`[ENV] Variáveis de ambiente carregadas com sucesso`);

    const app = express();
    app.use(cors());
    app.use(express.json());

    // Inicialização do Redis e Jobs
    try {
      const redisUrl = env.REDIS_URL.replace(/["']/g, ''); // Remove aspas extras
      const redis = new IORedis(redisUrl, { 
        maxRetriesPerRequest: null,
        family: 4, // Força IPv4 para evitar ::1
        connectTimeout: 10000, // 10 segundos de timeout
      });

      redis.on('error', (err) => {
        if (err.message.includes('ETIMEDOUT')) {
          console.error(`[REDIS] Timeout ao conectar em ${redisUrl}. Verifique se o serviço está rodando e o firewall permite a porta.`);
        } else {
          console.error(`[REDIS] Erro: ${err.message}`);
        }
      });

      redis.on('connect', () => {
        console.log(`[REDIS] Conectado com sucesso ao servidor.`);
      });

      setupRetentionCleanup(prisma, redis);
      setupNotificationCleanup(prisma, redis);
      console.log(`[JOBS] Configurando jobs (Redis: ${redisUrl})`);
    } catch (redisError) {
      console.warn(`[JOBS] Falha ao configurar Redis:`, redisError instanceof Error ? redisError.message : redisError);
    }

    app.get('/health', (_req, res) => {
      res.status(200).json({ status: 'ok', uptime: process.uptime() });
    });

    const protectedRouter = express.Router();
    protectedRouter.use(authMiddleware(() => env.API_TOKEN));
    protectedRouter.use('/metrics', createMetricsRouter(prisma));
    protectedRouter.use('/reports', createReportsRouter(prisma));
    protectedRouter.use('/customers', createCustomersRouter(prisma));
    protectedRouter.use('/orders', createOrdersRouter(prisma));
    protectedRouter.use('/print-jobs', createPrintJobsRouter(prisma));
    protectedRouter.use('/settings', createSettingsRouter(prisma));
    protectedRouter.use('/system-settings', createSystemSettingsRouter(prisma));
    protectedRouter.use('/notifications', createNotificationsRouter(prisma));

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
