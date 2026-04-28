-- CreateTable
CREATE TABLE `system_settings` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `cnpj` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `website` VARCHAR(191) NULL,
    `address_street` VARCHAR(191) NOT NULL,
    `address_number` VARCHAR(191) NOT NULL,
    `address_complement` VARCHAR(191) NULL,
    `address_city` VARCHAR(191) NOT NULL,
    `address_state` VARCHAR(191) NOT NULL,
    `address_zip` VARCHAR(191) NOT NULL,
    `logoPath` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
