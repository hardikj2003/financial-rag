import qdrantClient from "./qdrant.client";

const FINANCIAL_COLLECTION = "financial_docs";
const QDRANT_URL = process.env.QDRANT_URL ?? "http://localhost:6333";

export const createFinancialCollection = async () => {
  let collections;

  try {
    collections = await qdrantClient.getCollections();
  } catch (error) {
    console.error("Qdrant connection error:", error);
    throw new Error(
      `Unable to connect to Qdrant at ${QDRANT_URL}. Start Qdrant with "docker compose up -d qdrant" or set QDRANT_URL to a running Qdrant instance.`,
    );
  }

  const exists = collections.collections.some(
    (collection) => collection.name === FINANCIAL_COLLECTION,
  );

  if (exists) {
    console.log("Qdrant collection already exists");
    return;
  }

  await qdrantClient.createCollection(FINANCIAL_COLLECTION, {
    vectors: {
      size: 384,
      distance: "Cosine",
    },
  });

  console.log("Qdrant collection created");
};
