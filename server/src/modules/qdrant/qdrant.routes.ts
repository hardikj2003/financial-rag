import express from "express";
import qdrantClient from "./qdrant.client";
import { createFinancialCollection } from "./qdrant.service";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const collections = await qdrantClient.getCollections();

    res.json({
      success: true,
      collections,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: "Failed to connect to Qdrant",
    });
  }
});

router.post("/create-collection", async (req, res) => {
  try {
    await createFinancialCollection();

    res.json({
      success: true,
      message: "Collection created successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: "Failed to create collection",
    });
  }
});

export default router;
