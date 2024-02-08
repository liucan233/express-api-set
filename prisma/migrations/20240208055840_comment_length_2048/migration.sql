-- AlterTable
ALTER TABLE `Comment` MODIFY `content` VARCHAR(2048) NOT NULL;

-- AlterTable
ALTER TABLE `CommentReply` MODIFY `content` VARCHAR(2048) NOT NULL;
