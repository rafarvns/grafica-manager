/*
  Warnings:

  - A unique constraint covering the columns `[friendlyCode]` on the table `price_table_entries` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `price_table_entries` ADD COLUMN `friendlyCode` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `price_table_entries_friendlyCode_key` ON `price_table_entries`(`friendlyCode`);
