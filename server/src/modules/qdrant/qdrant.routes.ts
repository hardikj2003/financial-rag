import express from "express";
import qdrantClient from "./qdrant.client";

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

export default router;