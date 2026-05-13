import express from "express";
import cors from "cors";

import healthRoutes from "../src/routes/health.routes"
import qdrantRoutes from "./routes/qdrant.routes";
import ingestionRoutes from "./routes/ingestion.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Financial RAG API Running...");
});

app.use("/api/health", healthRoutes);
app.use("/api/qdrant", qdrantRoutes);
app.use("/api/ingestion", ingestionRoutes);

export default app;