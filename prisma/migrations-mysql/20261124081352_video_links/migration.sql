-- AlterTable
ALTER TABLE `Video`
    ADD COLUMN `provider` VARCHAR(191) NOT NULL DEFAULT 'youtube',
    ADD COLUMN `clipKey` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `sourceUrl` TEXT NULL,
    ADD COLUMN `embedStatus` VARCHAR(191) NOT NULL DEFAULT 'unchecked',
    ADD COLUMN `checkedAt` DATETIME(3) NULL;

UPDATE `Video` SET `sourceUrl` = '' WHERE `sourceUrl` IS NULL;

ALTER TABLE `Video` MODIFY `sourceUrl` TEXT NOT NULL,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'ready';
