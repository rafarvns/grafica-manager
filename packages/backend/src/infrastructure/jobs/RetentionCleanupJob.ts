import { Worker, Job } from 'bullmq';
import { RetentionCleanupUseCase } from '../../application/use-cases/RetentionCleanupUseCase';
import { PrismaOrderAttachmentRepository } from '../database/repositories/PrismaOrderAttachmentRepository';
import { LocalFileStorage } from '../file-storage/LocalFileStorage';
import { PrismaClient } from '@prisma/client';

export class RetentionCleanupJob {
  private worker: Worker;

  constructor(
    private cleanupUseCase: RetentionCleanupUseCase,
    redisConnection: any
  ) {
    this.worker = new Worker(
      'retention-cleanup',
      async (job: Job) => {
        console.log(`[JOB] Iniciando limpeza de retenção (Job ID: ${job.id})`);
        const result = await this.cleanupUseCase.execute();
        console.log(`[JOB] Limpeza concluída: ${result.deletedCount} arquivos removidos`);
        return result;
      },
      { connection: redisConnection }
    );

    this.worker.on('failed', (job, err) => {
      console.error(`[JOB] Falha no job de limpeza ${job?.id}:`, err);
    });
  }
}

// Helper para instanciar o job facilmente
export function setupRetentionCleanup(prisma: PrismaClient, redisConnection: any) {
  const repository = new PrismaOrderAttachmentRepository(prisma);
  const fileStorage = new LocalFileStorage();
  const useCase = new RetentionCleanupUseCase(repository, fileStorage);
  
  return new RetentionCleanupJob(useCase, redisConnection);
}
