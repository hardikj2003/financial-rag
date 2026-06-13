import { v4 as uuidv4 } from "uuid";
import { extractTextFromPDF } from "../../services/pdf.service";
import { generatePassageEmbeddings } from "../../services/embedding.service";
import { createSmartChunks } from "../../services/smartChunk.service";
import { detectCompany } from "../retrieval/utils/companyDetector";
import qdrantClient from "../qdrant/qdrant.client";
import { FINANCIAL_COLLECTION } from "../qdrant/qdrant.service";
import prisma from "../../config/prisma";
import { extractTables } from "../../services/tableExtraction.service";
import { extractFinancialMetrics } from "../../services/financialMetricExtraction.service";
import { logger } from "../../config/logger";

const UPSERT_BATCH_SIZE = 100;

export const ingestPDF = async (file: Express.Multer.File) => {
  // Reject duplicate uploads instead of silently doubling the corpus.
  const existing = await prisma.document.findFirst({
    where: { fileName: file.originalname },
  });

  if (existing) {
    throw new Error(
      `A document named "${file.originalname}" has already been ingested. Delete it first to re-upload.`,
    );
  }

  const startedAt = Date.now();
  const extractedText = await extractTextFromPDF(file.path);

  const tables = extractTables(extractedText);
  const metrics = tables.flatMap((table) =>
    extractFinancialMetrics(table.rows, table.unitHint),
  );

  const chunks = createSmartChunks(extractedText);
  if (chunks.length === 0) {
    throw new Error("No searchable text could be extracted from the PDF");
  }

  const documentId = uuidv4();
  const companyName = detectCompany(extractedText);

  // Batched embedding generation (previously one sequential call per chunk).
  const embeddings = await generatePassageEmbeddings(
    chunks.map((chunk) => chunk.text),
  );

  const points = chunks.map((chunk, index) => ({
    id: uuidv4(),
    vector: embeddings[index],
    payload: {
      documentId,
      text: chunk.text,
      companyName,
      documentName: file.originalname,
      chunkIndex: chunk.metadata.chunkIndex,
      sectionTitle: chunk.metadata.sectionTitle,
      parentId: chunk.metadata.parentId,
      parentText: chunk.metadata.parentText,
    },
  }));

  // Batched upserts: a single giant upsert times out on large filings.
  for (let i = 0; i < points.length; i += UPSERT_BATCH_SIZE) {
    await qdrantClient.upsert(FINANCIAL_COLLECTION, {
      wait: true,
      points: points.slice(i, i + UPSERT_BATCH_SIZE),
    });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.document.create({
        data: {
          id: documentId,
          fileName: file.originalname,
          chunksStored: chunks.length,
        },
      });

      if (metrics.length > 0) {
        await tx.financialMetric.createMany({
          data: metrics.map((metric) => ({
            documentId,
            metricName: metric.metricName,
            period: metric.period,
            value: metric.value,
            unit: metric.unit,
          })),
        });
      }

      if (tables.length > 0) {
        await tx.financialTable.createMany({
          data: tables.map((table) => ({
            documentId,
            tableName: table.tableName,
            rawTable: table.rows,
          })),
        });
      }
    });
  } catch (error) {
    // Compensating delete keeps Qdrant consistent with Postgres.
    await qdrantClient.delete(FINANCIAL_COLLECTION, {
      filter: {
        must: [{ key: "documentId", match: { value: documentId } }],
      },
    });

    throw error;
  }

  logger.info("pdf ingested", {
    documentId,
    fileName: file.originalname,
    companyName,
    chunks: chunks.length,
    tables: tables.length,
    metrics: metrics.length,
    durationMs: Date.now() - startedAt,
  });

  return {
    success: true,
    chunksStored: chunks.length,
  };
};
