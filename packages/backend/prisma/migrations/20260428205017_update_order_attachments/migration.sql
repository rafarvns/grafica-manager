/*
  Warnings:

  - You are about to drop the `order_files` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `order_files` DROP FOREIGN KEY `order_files_orderId_fkey`;

-- DropTable
DROP TABLE `order_files`;

-- CreateTable
CREATE TABLE `order_attachments` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `originalFilename` VARCHAR(191) NOT NULL,
    `filepath` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `order_attachments_filepath_key`(`filepath`),
    INDEX `order_attachments_orderId_idx`(`orderId`),
    INDEX `order_attachments_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `order_attachments` ADD CONSTRAINT `order_attachments_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
