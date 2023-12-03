/*
  Warnings:

  - A unique constraint covering the columns `[externalId]` on the table `CommentList` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `externalId` to the `CommentList` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `CommentList` ADD COLUMN `externalId` VARCHAR(191) NOT NULL;

-- 手动赋值新增列
UPDATE `CommentList` SET `externalId` = CONCAT('add_externalId_assign_', `id`);

-- CreateIndex
CREATE UNIQUE INDEX `CommentList_externalId_key` ON `CommentList`(`externalId`);
