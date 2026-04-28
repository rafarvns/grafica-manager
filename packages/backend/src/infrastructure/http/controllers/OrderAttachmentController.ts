import { Request, Response } from 'express';
import { UploadOrderAttachmentUseCase } from '@/application/use-cases/UploadOrderAttachmentUseCase';
import { ListOrderAttachmentsUseCase } from '@/application/use-cases/ListOrderAttachmentsUseCase';
import { DownloadOrderAttachmentUseCase } from '@/application/use-cases/DownloadOrderAttachmentUseCase';
import { DeleteOrderAttachmentUseCase } from '@/application/use-cases/DeleteOrderAttachmentUseCase';

export class OrderAttachmentController {
  constructor(
    private uploadUseCase: UploadOrderAttachmentUseCase,
    private listUseCase: ListOrderAttachmentsUseCase,
    private downloadUseCase: DownloadOrderAttachmentUseCase,
    private deleteUseCase: DeleteOrderAttachmentUseCase
  ) {}

  async upload(req: Request, res: Response) {
    try {
      const { id: orderId } = req.params;
      const file = req.file;

      if (!orderId) {
        return res.status(400).json({ error: 'ID do pedido não fornecido' });
      }

      if (!file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      const attachment = await this.uploadUseCase.execute({
        orderId,
        file: {
          buffer: file.buffer,
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        },
      });

      return res.status(201).json(attachment);
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Erro no upload' });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const { id: orderId } = req.params;
      if (!orderId) {
        return res.status(400).json({ error: 'ID do pedido não fornecido' });
      }
      const attachments = await this.listUseCase.execute(orderId);
      return res.json(attachments);
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Erro ao listar' });
    }
  }

  async download(req: Request, res: Response) {
    try {
      const { fileId } = req.params;
      if (!fileId) {
        return res.status(400).json({ error: 'ID do arquivo não fornecido' });
      }
      const { stream, originalFilename, mimeType } = await this.downloadUseCase.execute(fileId);

      res.setHeader('Content-Disposition', `attachment; filename="${originalFilename}"`);
      res.setHeader('Content-Type', mimeType);

      stream.pipe(res);
      return;
    } catch (error) {
      return res.status(404).json({ error: error instanceof Error ? error.message : 'Arquivo não encontrado' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { fileId } = req.params;
      if (!fileId) {
        return res.status(400).json({ error: 'ID do arquivo não fornecido' });
      }
      await this.deleteUseCase.execute(fileId);
      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Erro ao deletar' });
    }
  }
}
