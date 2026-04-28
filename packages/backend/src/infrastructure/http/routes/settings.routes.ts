import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPaperTypeRepository } from '@/infrastructure/database/PrismaPaperTypeRepository';
import { PrismaPrintPresetRepository } from '@/infrastructure/database/PrismaPrintPresetRepository';
import { PrismaPriceTableRepository } from '@/infrastructure/database/PrismaPriceTableRepository';
import { CreatePaperTypeUseCase } from '@/application/use-cases/CreatePaperTypeUseCase';
import { DeletePaperTypeUseCase } from '@/application/use-cases/DeletePaperTypeUseCase';
import { CreatePrintPresetUseCase } from '@/application/use-cases/CreatePrintPresetUseCase';
import { ManagePriceTableUseCase } from '@/application/use-cases/ManagePriceTableUseCase';

export function createSettingsRouter(prisma: PrismaClient): Router {
  const router = Router();
  
  const paperRepo = new PrismaPaperTypeRepository(prisma);
  const presetRepo = new PrismaPrintPresetRepository(prisma);
  const priceRepo = new PrismaPriceTableRepository(prisma);
  const printJobRepo = { // Simplified mock for countByPriceTableEntry
    countByPriceTableEntry: async (id: string) => {
      return await prisma.printJob.count({ where: { id: 'some-logic-placeholder' } });
    }
  };

  // --- Paper Types ---
  router.get('/paper-types', async (req, res) => {
    try {
      const result = await paperRepo.findAll({
        activeOnly: req.query.activeOnly === 'true'
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar tipos de papel' });
    }
  });

  router.post('/paper-types', async (req, res) => {
    try {
      const useCase = new CreatePaperTypeUseCase(paperRepo);
      const result = await useCase.execute(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Erro ao criar tipo de papel' });
    }
  });

  router.delete('/paper-types/:id', async (req, res) => {
    try {
      const useCase = new DeletePaperTypeUseCase(paperRepo);
      const result = await useCase.execute(req.params.id!, {
        force: req.query.force === 'true'
      });
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Erro ao deletar tipo de papel' });
    }
  });

  router.patch('/paper-types/:id/toggle', async (req, res) => {
    try {
      const useCase = new DeletePaperTypeUseCase(paperRepo);
      // If active is not provided, we toggle it (need to fetch first or pass explicit value)
      // For now, assume it's passed in body or we toggle based on current state
      const paper = await paperRepo.findById(req.params.id!);
      if (!paper) throw new Error('Tipo de papel não encontrado');
      
      const result = await useCase.toggleActive(req.params.id!, !paper.active);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Erro ao alterar status do papel' });
    }
  });

  // --- Print Presets ---
  router.get('/presets', async (req, res) => {
    try {
      const result = await presetRepo.findAll({
        activeOnly: req.query.activeOnly === 'true'
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar presets' });
    }
  });

  router.post('/presets', async (req, res) => {
    try {
      const useCase = new CreatePrintPresetUseCase(presetRepo, paperRepo);
      const result = await useCase.execute(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Erro ao criar preset' });
    }
  });

  // --- Price Table ---
  router.get('/prices', async (req, res) => {
    try {
      const result = await priceRepo.findAll();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar tabela de preços' });
    }
  });

  router.post('/prices', async (req, res) => {
    try {
      const useCase = new ManagePriceTableUseCase(priceRepo, printJobRepo as any);
      const result = await useCase.createPrice(req.body);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Erro ao criar preço' });
    }
  });

  router.put('/prices/:id', async (req, res) => {
    try {
      const useCase = new ManagePriceTableUseCase(priceRepo, printJobRepo as any);
      const result = await useCase.updatePrice({ ...req.body, id: req.params.id });
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Erro ao atualizar preço' });
    }
  });

  router.delete('/prices/:id', async (req, res) => {
    try {
      const useCase = new ManagePriceTableUseCase(priceRepo, printJobRepo as any);
      const result = await useCase.deletePrice(req.params.id);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Erro ao deletar preço' });
    }
  });

  return router;
}
