import express from "express";
import cors from "cors";

import qdrantRoutes from "./modules/qdrant/qdrant.routes";
import ingestionRoutes from "./modules/ingestion/ingestion.routes";
import retrievalRoutes from "./modules/retrieval/retrieval.routes";
import memoryRoutes from "./modules/memory/memory.routes";
import documentsRoutes from "./modules/documents/documents.routes";
import { clerkMiddleware } from "@clerk/express";
import adminRoutes from "./modules/admin/admin.routes";

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());
app.use(clerkMiddleware());

app.get("/", (req, res) => {
  res.send("Financial RAG API Running...");
});

app.use("/api/qdrant", qdrantRoutes);
app.use("/api/ingestion", ingestionRoutes);
app.use("/api/retrieval", retrievalRoutes);
app.use("/api/memory", memoryRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/admin", adminRoutes);

export default app;
