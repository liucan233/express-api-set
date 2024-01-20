-- AlterTable
ALTER TABLE `User` ADD COLUMN `avatar` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `EmailVerification` (
    `email` VARCHAR(191) NOT NULL,
    `captcha` VARCHAR(6) NOT NULL,

    UNIQUE INDEX `EmailVerification_email_key`(`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
