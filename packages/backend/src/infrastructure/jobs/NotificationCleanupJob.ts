import { PrismaClient } from '@prisma/client';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaNotificationRepository } from '../database/repositories/PrismaNotificationRepository';

const QUEUE_NAME = 'notification_cleanup';

export function setupNotificationCleanup(prisma: PrismaClient, redis: IORedis) {
  const repository = new PrismaNotificationRepository(prisma);
  
  const queue = new Queue(QUEUE_NAME, { connection: redis });

  const worker = new Worker(QUEUE_NAME, async () => {
    console.log('[JOBS] Iniciando limpeza de notificações antigas (> 30 dias)');
    const count = await repository.deleteOlderThan(30);
    console.log(`[JOBS] Limpeza concluída: ${count} notificações removidas.`);
  }, { connection: redis });

  // Agendar para rodar diariamente à meia-noite
  queue.add('cleanup', {}, {
    repeat: { pattern: '0 0 * * *' }
  });

  return { queue, worker };
}
