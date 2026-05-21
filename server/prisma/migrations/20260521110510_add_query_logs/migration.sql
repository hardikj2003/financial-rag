-- CreateTable
CREATE TABLE "QueryLog" (
    "id" TEXT NOT NULL,
    "originalQuery" TEXT NOT NULL,
    "rewrittenQuery" TEXT,
    "retrievalTimeMs" INTEGER,
    "generationTimeMs" INTEGER,
    "totalSources" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QueryLog_pkey" PRIMARY KEY ("id")
);
