/*
  Warnings:

  - You are about to drop the column `description` on the `price_table_entries` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `price_table_entries` table. All the data in the column will be lost.
  - You are about to drop the column `pricePerUnit` on the `price_table_entries` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `price_table_entries` table. All the data in the column will be lost.
  - Added the required column `colors` to the `price_table_entries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paperTypeId` to the `price_table_entries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quality` to the `price_table_entries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitPrice` to the `price_table_entries` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `paper_types` ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `color` VARCHAR(191) NULL,
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `size` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `price_table_entries` DROP COLUMN `description`,
    DROP COLUMN `name`,
    DROP COLUMN `pricePerUnit`,
    DROP COLUMN `unit`,
    ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `colors` VARCHAR(191) NOT NULL,
    ADD COLUMN `paperTypeId` VARCHAR(191) NOT NULL,
    ADD COLUMN `quality` VARCHAR(191) NOT NULL,
    ADD COLUMN `unitPrice` DECIMAL(12, 4) NOT NULL,
    ADD COLUMN `validUntil` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `print_presets` ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `colors` VARCHAR(191) NULL,
    ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `finish` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `paper_types_deletedAt_idx` ON `paper_types`(`deletedAt`);

-- CreateIndex
CREATE INDEX `price_table_entries_paperTypeId_idx` ON `price_table_entries`(`paperTypeId`);

-- CreateIndex
CREATE INDEX `print_presets_deletedAt_idx` ON `print_presets`(`deletedAt`);

-- AddForeignKey
ALTER TABLE `price_table_entries` ADD CONSTRAINT `price_table_entries_paperTypeId_fkey` FOREIGN KEY (`paperTypeId`) REFERENCES `paper_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
