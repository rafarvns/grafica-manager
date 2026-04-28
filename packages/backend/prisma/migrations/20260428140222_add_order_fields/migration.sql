/*
  Warnings:

  - Added the required column `description` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `orders` ADD COLUMN `description` TEXT NOT NULL,
    ADD COLUMN `dueDate` DATETIME(3) NULL,
    ADD COLUMN `height` DECIMAL(12, 4) NULL,
    ADD COLUMN `paperTypeId` VARCHAR(191) NULL,
    ADD COLUMN `quantity` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `width` DECIMAL(12, 4) NULL;

-- CreateIndex
CREATE INDEX `orders_paperTypeId_idx` ON `orders`(`paperTypeId`);

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_paperTypeId_fkey` FOREIGN KEY (`paperTypeId`) REFERENCES `paper_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
