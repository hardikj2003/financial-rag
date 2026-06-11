-- CreateTable
CREATE TABLE "FinancialMetric" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialMetric_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FinancialMetric" ADD CONSTRAINT "FinancialMetric_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
