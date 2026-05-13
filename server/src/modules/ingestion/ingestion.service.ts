import { v4 as uuidv4 } from "uuid";

import { extractTextFromPDF } from "../../services/pdf.service";
import { chunkText } from "../../services/chunk.service";
import { generateEmbedding } from "../../services/embedding.service";

import qdrantClient from "../../modules/qdrant/qdrant.client";

export const ingestPDF = async (filePath: string) => {
  const text = await extractTextFromPDF(filePath);

  const chunks = await chunkText(text);

  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk.pageContent);

    await qdrantClient.upsert("financial_docs", {
      wait: true,
      points: [
        {
          id: uuidv4(),
          vector: embedding,
          payload: {
            text: chunk.pageContent,
          },
        },
      ],
    });
  }

  return {
    success: true,
    chunksStored: chunks.length,
  };
};
