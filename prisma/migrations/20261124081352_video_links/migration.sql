-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Video" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advertId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'youtube',
    "clipKey" TEXT NOT NULL DEFAULT '',
    "remoteId" TEXT NOT NULL DEFAULT '',
    "sourceUrl" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'ready',
    "embedStatus" TEXT NOT NULL DEFAULT 'unchecked',
    "posterPath" TEXT NOT NULL DEFAULT '',
    "playbackPath" TEXT NOT NULL DEFAULT '',
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "clips" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "checkedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Video_advertId_fkey" FOREIGN KEY ("advertId") REFERENCES "Advert" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Video" ("advertId", "clips", "createdAt", "durationSec", "id", "playbackPath", "posterPath", "remoteId", "sortOrder", "status") SELECT "advertId", "clips", "createdAt", "durationSec", "id", "playbackPath", "posterPath", "remoteId", "sortOrder", "status" FROM "Video";
DROP TABLE "Video";
ALTER TABLE "new_Video" RENAME TO "Video";
CREATE INDEX "Video_advertId_idx" ON "Video"("advertId");
CREATE INDEX "Video_remoteId_idx" ON "Video"("remoteId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
