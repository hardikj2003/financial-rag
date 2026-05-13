import qdrantClient from "./qdrant.client";

export const createFinancialCollection = async () => {
  try {
    await qdrantClient.createCollection("financial_docs", {
      vectors: {
        size: 384,
        distance: "Cosine",
      },
    });

    console.log("Qdrant collection created");
  } catch (error) {
    console.log("Collection may already exist");
  }
};