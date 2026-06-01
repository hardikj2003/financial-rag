-- CreateTable
CREATE TABLE "FinancialTable" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "tableName" TEXT,
    "sectionName" TEXT,
    "rawTable" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialTable_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FinancialTable" ADD CONSTRAINT "FinancialTable_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
