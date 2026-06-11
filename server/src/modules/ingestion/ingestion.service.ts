import { v4 as uuidv4 } from "uuid";
import { extractTextFromPDF } from "../../services/pdf.service";
import { generateEmbedding } from "../../services/embedding.service";
import { createSmartChunks } from "../../services/smartChunk.service";
import { detectCompany } from "../retrieval/utils/companyDetector";
import qdrantClient from "../qdrant/qdrant.client";
import prisma from "../../config/prisma";
import { extractTables } from "../../services/tableExtraction.service";
import { extractFinancialMetrics } from "../../services/financialMetricExtraction.service";

export const ingestPDF = async (file: Express.Multer.File) => {
  const extractedText = await extractTextFromPDF(file.path);
  const tables = extractTables(extractedText);
  const metrics = tables.flatMap((table) =>
    extractFinancialMetrics(table.rows),
  );

  const chunks = createSmartChunks(extractedText);
  if (chunks.length === 0) {
    throw new Error("No searchable text could be extracted from the PDF");
  }

  const documentId = uuidv4();
  const points = [];
  const companyName = detectCompany(extractedText);

  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index];

    const embedding = await generateEmbedding(chunk.text);

    points.push({
      id: uuidv4(),
      vector: embedding,
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
    });
  }

  await qdrantClient.upsert("financial_docs", {
    wait: true,
    points,
  });

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
    await qdrantClient.delete("financial_docs", {
      filter: {
        must: [
          {
            key: "documentId",
            match: {
              value: documentId,
            },
          },
        ],
      },
    });

    throw error;
  }

  return {
    success: true,
    chunksStored: chunks.length,
  };
};
