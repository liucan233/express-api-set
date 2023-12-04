/*
  Warnings:

  - You are about to drop the column `replyUserId` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the `CommentList` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Comment` DROP FOREIGN KEY `Comment_replyUserId_fkey`;

-- DropForeignKey
ALTER TABLE `Comment` DROP FOREIGN KEY `Comment_sourceId_fkey`;

-- AlterTable
ALTER TABLE `Comment` DROP COLUMN `replyUserId`;

-- CreateTable
CREATE TABLE `CommentSource` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `desc` VARCHAR(191) NULL,
    `externalId` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `CommentSource_externalId_key`(`externalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 手动移动数据
INSERT INTO CommentSource (userId, id, `desc`, externalId)
SELECT 1, id, `desc`, externalId FROM CommentList;

-- DropTable
DROP TABLE `CommentList`;

-- CreateTable
CREATE TABLE `CommentReply` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sourceId` INTEGER NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `replyUserId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CommentSource` ADD CONSTRAINT `CommentSource_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `CommentSource`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommentReply` ADD CONSTRAINT `CommentReply_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `Comment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommentReply` ADD CONSTRAINT `CommentReply_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommentReply` ADD CONSTRAINT `CommentReply_replyUserId_fkey` FOREIGN KEY (`replyUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
