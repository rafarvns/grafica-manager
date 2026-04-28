import { OrderAttachmentRepository } from '../../domain/repositories/OrderAttachmentRepository';
import { FileStorage } from '../ports/FileStorage';

export class RetentionCleanupUseCase {
  constructor(
    private repository: OrderAttachmentRepository,
    private fileStorage: FileStorage
  ) {}

  async execute(): Promise<{ deletedCount: number }> {
    // Cutoff date: 90 days ago
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const expiredAttachments = await this.repository.findExpiredForRetention(cutoffDate);

    let deletedCount = 0;
    for (const attachment of expiredAttachments) {
      try {
        // Delete from disk
        await this.fileStorage.delete(attachment.filepath);
        
        // Delete from database
        await this.repository.deletePhysical(attachment.id);
        
        deletedCount++;
      } catch (error) {
        console.error(`Failed to cleanup attachment ${attachment.id}:`, error);
      }
    }

    return { deletedCount };
  }
}
