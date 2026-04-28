import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { PrismaSystemSettingsRepository } from '../../database/PrismaSystemSettingsRepository';
import { SystemSettingsCache } from '../../cache/SystemSettingsCache';
import { GetSystemSettingsUseCase } from '../../../application/use-cases/GetSystemSettingsUseCase';
import { UpdateSystemSettingsUseCase } from '../../../application/use-cases/UpdateSystemSettingsUseCase';
import { FileStorageService } from '../../services/FileStorageService';

export function createSystemSettingsRouter(prisma: PrismaClient): Router {
  const router = Router();
  const repository = new PrismaSystemSettingsRepository(prisma);
  const cache = SystemSettingsCache.getInstance();
  const fileStorage = new FileStorageService();
  
  const upload = multer({ 
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  });

  router.get('/', async (req: Request, res: Response) => {
    try {
      const useCase = new GetSystemSettingsUseCase(repository, cache);
      const settings = await useCase.execute();
      return res.json(settings);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro interno';
      return res.status(500).json({ error: msg });
    }
  });

  router.patch('/', async (req: Request, res: Response) => {
    try {
      const useCase = new UpdateSystemSettingsUseCase(repository, cache);
      const settings = await useCase.execute(req.body);
      return res.json(settings);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro interno';
      return res.status(400).json({ error: msg });
    }
  });

  router.post('/logo', upload.single('logo'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Arquivo de logo não enviado' });
      }

      const logoPath = await fileStorage.saveLogo(req.file.buffer, req.file.originalname);
      
      const useCase = new UpdateSystemSettingsUseCase(repository, cache);
      const settings = await useCase.execute({ logoPath });
      
      return res.json({ message: 'Logo atualizada com sucesso', settings });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro interno';
      return res.status(400).json({ error: msg });
    }
  });

  router.delete('/logo', async (req: Request, res: Response) => {
    try {
      const useCase = new GetSystemSettingsUseCase(repository, cache);
      const settings = await useCase.execute();
      
      if (settings.logoPath) {
        await fileStorage.deleteLogo(settings.logoPath);
        const updateUseCase = new UpdateSystemSettingsUseCase(repository, cache);
        await updateUseCase.execute({ logoPath: null });
      }
      
      return res.json({ message: 'Logo removida com sucesso' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro interno';
      return res.status(400).json({ error: msg });
    }
  });

  return router;
}
