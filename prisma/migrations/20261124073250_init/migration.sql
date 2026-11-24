-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'buyer',
    "sellerType" TEXT NOT NULL DEFAULT 'private',
    "phone" TEXT NOT NULL DEFAULT '',
    "emailVerifiedAt" DATETIME,
    "idStatus" TEXT NOT NULL DEFAULT 'none',
    "idVerifiedAt" DATETIME,
    "idSessionId" TEXT NOT NULL DEFAULT '',
    "county" TEXT NOT NULL DEFAULT '',
    "postcode" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "bannedAt" DATETIME,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "tradeUntil" DATETIME,
    "referralCode" TEXT NOT NULL,
    "referredBy" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmailToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Advert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sellerId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL,
    "breed" TEXT NOT NULL DEFAULT '',
    "horseName" TEXT NOT NULL DEFAULT '',
    "ageYears" INTEGER NOT NULL DEFAULT 0,
    "ageMonths" INTEGER NOT NULL DEFAULT 0,
    "heightInches" INTEGER NOT NULL DEFAULT 0,
    "colour" TEXT NOT NULL DEFAULT '',
    "sex" TEXT NOT NULL DEFAULT '',
    "level" TEXT NOT NULL DEFAULT '',
    "suits" TEXT NOT NULL DEFAULT '',
    "pricePence" INTEGER NOT NULL DEFAULT 0,
    "negotiable" BOOLEAN NOT NULL DEFAULT false,
    "postcode" TEXT NOT NULL DEFAULT '',
    "outcode" TEXT NOT NULL DEFAULT '',
    "town" TEXT NOT NULL DEFAULT '',
    "county" TEXT NOT NULL DEFAULT '',
    "region" TEXT NOT NULL DEFAULT '',
    "lat" REAL NOT NULL DEFAULT 0,
    "lng" REAL NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL DEFAULT '',
    "videoNote" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "soldAt" DATETIME,
    "soldPricePence" INTEGER,
    "showSoldPrice" BOOLEAN NOT NULL DEFAULT false,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "tierSlug" TEXT NOT NULL DEFAULT 'standard',
    "paidAt" DATETIME,
    "clips" TEXT NOT NULL DEFAULT '',
    "socialCaption" TEXT NOT NULL DEFAULT '',
    "rejectionNote" TEXT NOT NULL DEFAULT '',
    "nudgedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    CONSTRAINT "Advert_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advertId" TEXT NOT NULL,
    "remoteId" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'processing',
    "posterPath" TEXT NOT NULL DEFAULT '',
    "playbackPath" TEXT NOT NULL DEFAULT '',
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "clips" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Video_advertId_fkey" FOREIGN KEY ("advertId") REFERENCES "Advert" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advertId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "alt" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Photo_advertId_fkey" FOREIGN KEY ("advertId") REFERENCES "Advert" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advertId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "issuedOn" DATETIME,
    "visibility" TEXT NOT NULL DEFAULT 'logged_in',
    "filename" TEXT NOT NULL DEFAULT '',
    "storagePath" TEXT NOT NULL DEFAULT '',
    "microchip" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Document_advertId_fkey" FOREIGN KEY ("advertId") REFERENCES "Advert" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Trait" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advertId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "Trait_advertId_fkey" FOREIGN KEY ("advertId") REFERENCES "Advert" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Thread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advertId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Thread_advertId_fkey" FOREIGN KEY ("advertId") REFERENCES "Advert" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Thread_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Thread_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "threadId" TEXT NOT NULL,
    "advertId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "redacted" TEXT NOT NULL DEFAULT '',
    "scamFlags" TEXT NOT NULL DEFAULT '',
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_advertId_fkey" FOREIGN KEY ("advertId") REFERENCES "Advert" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advertId" TEXT,
    "messageId" TEXT NOT NULL DEFAULT '',
    "reporterId" TEXT,
    "reason" TEXT NOT NULL,
    "details" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_advertId_fkey" FOREIGN KEY ("advertId") REFERENCES "Advert" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SavedSearch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" TEXT NOT NULL,
    "alerts" BOOLEAN NOT NULL DEFAULT true,
    "lastNotifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribeToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SavedAdvert" (
    "userId" TEXT NOT NULL,
    "advertId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("userId", "advertId"),
    CONSTRAINT "SavedAdvert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SavedAdvert_advertId_fkey" FOREIGN KEY ("advertId") REFERENCES "Advert" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PricingTier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "pricePence" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "appliesTo" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "advertId" TEXT,
    "tierSlug" TEXT NOT NULL,
    "amountPence" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "provider" TEXT NOT NULL DEFAULT 'stripe',
    "checkoutRef" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" DATETIME,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_advertId_fkey" FOREIGN KEY ("advertId") REFERENCES "Advert" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT NOT NULL DEFAULT '',
    "actorType" TEXT NOT NULL DEFAULT 'system',
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL DEFAULT '',
    "targetId" TEXT NOT NULL DEFAULT '',
    "detail" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "OutboxEmail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "toEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" DATETIME
);

-- CreateTable
CREATE TABLE "BotEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" DATETIME
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "EmailToken_tokenHash_key" ON "EmailToken"("tokenHash");

-- CreateIndex
CREATE INDEX "EmailToken_userId_idx" ON "EmailToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Advert_slug_key" ON "Advert"("slug");

-- CreateIndex
CREATE INDEX "Advert_status_type_idx" ON "Advert"("status", "type");

-- CreateIndex
CREATE INDEX "Advert_status_county_idx" ON "Advert"("status", "county");

-- CreateIndex
CREATE INDEX "Advert_sellerId_idx" ON "Advert"("sellerId");

-- CreateIndex
CREATE INDEX "Advert_publishedAt_idx" ON "Advert"("publishedAt");

-- CreateIndex
CREATE INDEX "Video_advertId_idx" ON "Video"("advertId");

-- CreateIndex
CREATE INDEX "Video_remoteId_idx" ON "Video"("remoteId");

-- CreateIndex
CREATE INDEX "Photo_advertId_idx" ON "Photo"("advertId");

-- CreateIndex
CREATE INDEX "Document_advertId_idx" ON "Document"("advertId");

-- CreateIndex
CREATE UNIQUE INDEX "Trait_advertId_key_key" ON "Trait"("advertId", "key");

-- CreateIndex
CREATE INDEX "Thread_sellerId_idx" ON "Thread"("sellerId");

-- CreateIndex
CREATE INDEX "Thread_buyerId_idx" ON "Thread"("buyerId");

-- CreateIndex
CREATE UNIQUE INDEX "Thread_advertId_buyerId_key" ON "Thread"("advertId", "buyerId");

-- CreateIndex
CREATE INDEX "Message_threadId_idx" ON "Message"("threadId");

-- CreateIndex
CREATE INDEX "Message_flagged_idx" ON "Message"("flagged");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SavedSearch_unsubscribeToken_key" ON "SavedSearch"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "SavedSearch_userId_idx" ON "SavedSearch"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PricingTier_slug_key" ON "PricingTier"("slug");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_checkoutRef_idx" ON "Payment"("checkoutRef");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "OutboxEmail_status_idx" ON "OutboxEmail"("status");

-- CreateIndex
CREATE INDEX "BotEvent_status_idx" ON "BotEvent"("status");
