/*
  Warnings:

  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `User`
ADD COLUMN `password` VARCHAR(191)
NOT NULL
DEFAULT '204d5303cac59e2a5ca4a10b56c178fcb34d6f37368591ad4386f3f5c61e140a';

ALTER TABLE `User` ALTER COLUMN `password` DROP DEFAULT;
