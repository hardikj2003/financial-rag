-- CreateTable
CREATE TABLE "QueryTrace" (
    "id" TEXT NOT NULL,
    "chatId" TEXT,
    "userId" TEXT,
    "originalQuery" TEXT NOT NULL,
    "rewrittenQuery" TEXT,
    "generatedQueries" TEXT[],
    "queryType" TEXT,
    "companies" TEXT[],
    "isComparison" BOOLEAN NOT NULL DEFAULT false,
    "isAdvice" BOOLEAN NOT NULL DEFAULT false,
    "totalMs" INTEGER,
    "retrievalMs" INTEGER,
    "generationMs" INTEGER,
    "verificationMs" INTEGER,
    "candidateCount" INTEGER,
    "finalSourceCount" INTEGER,
    "citedSourceCount" INTEGER,
    "contextChars" INTEGER,
    "promptChars" INTEGER,
    "estInputTokens" INTEGER,
    "estOutputTokens" INTEGER,
    "estCostUsd" DOUBLE PRECISION,
    "avgRetrievalScore" DOUBLE PRECISION,
    "avgRerankScore" DOUBLE PRECISION,
    "citationCoverage" DOUBLE PRECISION,
    "verification" TEXT,
    "answerLength" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ok',
    "failureType" TEXT,
    "errorMessage" TEXT,
    "model" TEXT,
    "memoryCompany" TEXT,
    "memoryTopics" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QueryTrace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetrievalTrace" (
    "id" TEXT NOT NULL,
    "queryTraceId" TEXT NOT NULL,
    "retriever" TEXT NOT NULL,
    "searchQuery" TEXT,
    "company" TEXT,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "results" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RetrievalTrace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FusionTrace" (
    "id" TEXT NOT NULL,
    "queryTraceId" TEXT NOT NULL,
    "beforeCount" INTEGER NOT NULL DEFAULT 0,
    "afterCount" INTEGER NOT NULL DEFAULT 0,
    "items" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FusionTrace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RerankTrace" (
    "id" TEXT NOT NULL,
    "queryTraceId" TEXT NOT NULL,
    "beforeCount" INTEGER NOT NULL DEFAULT 0,
    "afterCount" INTEGER NOT NULL DEFAULT 0,
    "items" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RerankTrace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptTrace" (
    "id" TEXT NOT NULL,
    "queryTraceId" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "finalPrompt" TEXT NOT NULL,
    "chars" INTEGER NOT NULL DEFAULT 0,
    "estTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptTrace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LLMTrace" (
    "id" TEXT NOT NULL,
    "queryTraceId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "streamMs" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LLMTrace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationTrace" (
    "id" TEXT NOT NULL,
    "queryTraceId" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "citedSources" INTEGER NOT NULL DEFAULT 0,
    "totalSources" INTEGER NOT NULL DEFAULT 0,
    "evidence" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationTrace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricTrace" (
    "id" TEXT NOT NULL,
    "queryTraceId" TEXT NOT NULL,
    "companies" TEXT[],
    "topics" TEXT[],
    "metrics" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricTrace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QueryTrace_createdAt_idx" ON "QueryTrace"("createdAt");

-- CreateIndex
CREATE INDEX "QueryTrace_userId_createdAt_idx" ON "QueryTrace"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "QueryTrace_status_idx" ON "QueryTrace"("status");

-- CreateIndex
CREATE INDEX "RetrievalTrace_queryTraceId_idx" ON "RetrievalTrace"("queryTraceId");

-- CreateIndex
CREATE UNIQUE INDEX "FusionTrace_queryTraceId_key" ON "FusionTrace"("queryTraceId");

-- CreateIndex
CREATE UNIQUE INDEX "RerankTrace_queryTraceId_key" ON "RerankTrace"("queryTraceId");

-- CreateIndex
CREATE UNIQUE INDEX "PromptTrace_queryTraceId_key" ON "PromptTrace"("queryTraceId");

-- CreateIndex
CREATE UNIQUE INDEX "LLMTrace_queryTraceId_key" ON "LLMTrace"("queryTraceId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationTrace_queryTraceId_key" ON "VerificationTrace"("queryTraceId");

-- CreateIndex
CREATE UNIQUE INDEX "MetricTrace_queryTraceId_key" ON "MetricTrace"("queryTraceId");

-- AddForeignKey
ALTER TABLE "RetrievalTrace" ADD CONSTRAINT "RetrievalTrace_queryTraceId_fkey" FOREIGN KEY ("queryTraceId") REFERENCES "QueryTrace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FusionTrace" ADD CONSTRAINT "FusionTrace_queryTraceId_fkey" FOREIGN KEY ("queryTraceId") REFERENCES "QueryTrace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RerankTrace" ADD CONSTRAINT "RerankTrace_queryTraceId_fkey" FOREIGN KEY ("queryTraceId") REFERENCES "QueryTrace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptTrace" ADD CONSTRAINT "PromptTrace_queryTraceId_fkey" FOREIGN KEY ("queryTraceId") REFERENCES "QueryTrace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LLMTrace" ADD CONSTRAINT "LLMTrace_queryTraceId_fkey" FOREIGN KEY ("queryTraceId") REFERENCES "QueryTrace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationTrace" ADD CONSTRAINT "VerificationTrace_queryTraceId_fkey" FOREIGN KEY ("queryTraceId") REFERENCES "QueryTrace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricTrace" ADD CONSTRAINT "MetricTrace_queryTraceId_fkey" FOREIGN KEY ("queryTraceId") REFERENCES "QueryTrace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
