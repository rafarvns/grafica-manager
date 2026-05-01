/*
  Warnings:

  - You are about to drop the column `height` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `paperTypeId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `productionCost` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `width` on the `orders` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `orders` DROP FOREIGN KEY `orders_paperTypeId_fkey`;

-- AlterTable
ALTER TABLE `orders` DROP COLUMN `height`,
    DROP COLUMN `paperTypeId`,
    DROP COLUMN `productionCost`,
    DROP COLUMN `width`,
    ADD COLUMN `priceTableEntryId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `orders_priceTableEntryId_idx` ON `orders`(`priceTableEntryId`);

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_priceTableEntryId_fkey` FOREIGN KEY (`priceTableEntryId`) REFERENCES `price_table_entries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
