import qdrantClient from "./qdrant.client";
import { logger } from "../../config/logger";

export const FINANCIAL_COLLECTION = "financial_docs";

const QDRANT_URL = process.env.QDRANT_URL ?? "http://localhost:6333";

const PAYLOAD_INDEXES: Array<{ field: string; schema: "keyword" }> = [
  { field: "documentId", schema: "keyword" },
  { field: "companyName", schema: "keyword" },
  { field: "sectionTitle", schema: "keyword" },
];

/**
 * Payload indexes back every filtered operation we run (delete by document,
 * company-filtered search, section-filtered scroll). Without them Qdrant
 * falls back to full scans.
 */
const ensurePayloadIndexes = async () => {
  for (const { field, schema } of PAYLOAD_INDEXES) {
    try {
      await qdrantClient.createPayloadIndex(FINANCIAL_COLLECTION, {
        field_name: field,
        field_schema: schema,
        wait: true,
      });
    } catch {
      // Index already exists — createPayloadIndex is not idempotent across
      // all Qdrant versions, so an error here is expected on restart.
    }
  }
};

export const createFinancialCollection = async () => {
  let collections;

  try {
    collections = await qdrantClient.getCollections();
  } catch (error) {
    logger.error("qdrant connection failed", error, { url: QDRANT_URL });
    throw new Error(
      `Unable to connect to Qdrant at ${QDRANT_URL}. Start Qdrant with "docker compose up -d qdrant" or set QDRANT_URL to a running Qdrant instance.`,
    );
  }

  const exists = collections.collections.some(
    (collection) => collection.name === FINANCIAL_COLLECTION,
  );

  if (!exists) {
    await qdrantClient.createCollection(FINANCIAL_COLLECTION, {
      vectors: {
        size: 384,
        distance: "Cosine",
      },
    });

    logger.info("qdrant collection created", {
      collection: FINANCIAL_COLLECTION,
    });
  }

  await ensurePayloadIndexes();
};
