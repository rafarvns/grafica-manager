import { describe, it, expect, beforeAll, vi } from 'vitest';
import express, { Express } from 'express';
import request from 'supertest';
import { createReportsRouter } from '@/infrastructure/http/routes/reports.routes';
import { PrismaClient } from '@prisma/client';
import { ReportResult } from '@grafica/shared';

const mockReportResult: ReportResult = {
  rows: [
    {
      orderId: '1',
      orderNumber: 'ORD-001',
      customerId: 'cust-1',
      customerName: 'João Silva',
      paperType: 'Couchê',
      quantity: 10,
      salePrice: 100,
      cost: 40,
      margin: 60,
      marginPercent: 60,
      date: '2026-04-05T10:00:00Z',
      origin: 'MANUAL',
    },
  ],
  totals: {
    totalOrders: 1,
    totalQuantity: 10,
    totalCost: 40,
    totalRevenue: 100,
    totalMargin: 60,
    marginPercent: 60,
    ticketAverage: 100,
  },
  pagination: {
    page: 1,
    pageSize: 50,
    totalCount: 1,
  },
};

// Mock do repositório será feito via vi.mock ou passando um mock para o router se ele aceitasse, 
// mas o router instancia o repositório dentro. Então precisamos mockar o módulo do repositório.
vi.mock('@/infrastructure/database/PrismaReportRepository', () => {
  return {
    PrismaReportRepository: vi.fn().mockImplementation(() => ({
      queryReportRows: vi.fn().mockResolvedValue({
        rows: mockReportResult.rows,
        totalCount: 1,
      }),
      streamReportRows: vi.fn().mockImplementation(async function* () {
        for (const row of mockReportResult.rows) yield row;
      }),
    })),
  };
});

vi.mock('@/infrastructure/exporters/ExcelExporter', () => {
  return {
    ExcelExporter: vi.fn().mockImplementation(() => ({
      generate: vi.fn().mockResolvedValue(Buffer.from('fake-excel')),
    })),
  };
});

// Adicionando mock para PdfExporter que ainda não existe no código mas existirá
vi.mock('@/infrastructure/exporters/PdfExporter', () => {
  return {
    PdfExporter: vi.fn().mockImplementation(() => ({
      generate: vi.fn().mockResolvedValue(Buffer.from('fake-pdf')),
    })),
  };
});

describe('Reports Routes Integration', () => {
  let app: Express;
  const prismaMock = {} as PrismaClient;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/reports', createReportsRouter(prismaMock));
  });

  describe('GET /api/v1/reports/generate', () => {
    it('should return report data with status 200', async () => {
      const response = await request(app)
        .get('/api/v1/reports/generate')
        .query({ startDate: '2026-04-01', endDate: '2026-04-30' });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockReportResult);
    });

    it('should return 400 if startDate is missing', async () => {
      const response = await request(app)
        .get('/api/v1/reports/generate')
        .query({ endDate: '2026-04-30' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/reports/export', () => {
    it('should return CSV file with status 200', async () => {
      const response = await request(app)
        .post('/api/v1/reports/export')
        .send({
          filters: { startDate: '2026-04-01', endDate: '2026-04-30' },
          format: 'csv'
        });

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toContain('text/csv');
    });

    it('should return PDF file with status 200', async () => {
      const response = await request(app)
        .post('/api/v1/reports/export')
        .send({
          filters: { startDate: '2026-04-01', endDate: '2026-04-30' },
          format: 'pdf'
        });

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toContain('application/pdf');
    });
  });
});
