import express from "express";
import cors from "cors";

import qdrantRoutes from "./modules/qdrant/qdrant.routes";
import ingestionRoutes from "./modules/ingestion/ingestion.routes";
import retrievalRoutes from "./modules/retrieval/retrieval.routes";
import memoryRoutes from "./modules/memory/memory.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Financial RAG API Running...");
});

app.use("/api/qdrant", qdrantRoutes);
app.use("/api/ingestion", ingestionRoutes);
app.use("/api/retrieval", retrievalRoutes);
app.use("/api/memory", memoryRoutes);

export default app;
