import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

import qdrantRoutes from "./modules/qdrant/qdrant.routes";
import ingestionRoutes from "./modules/ingestion/ingestion.routes";
import retrievalRoutes from "./modules/retrieval/retrieval.routes";
import memoryRoutes from "./modules/memory/memory.routes";
import documentsRoutes from "./modules/documents/documents.routes";
import adminRoutes from "./modules/admin/admin.routes";
import { logger } from "./config/logger";

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
app.use(express.json({ limit: "100kb" }));
app.use(clerkMiddleware());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.send("Financial RAG API Running...");
});

app.use("/api/qdrant", qdrantRoutes);
app.use("/api/ingestion", ingestionRoutes);
app.use("/api/retrieval", retrievalRoutes);
app.use("/api/memory", memoryRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: "Not found" });
});

// Central error handler: catches anything controllers let escape (Express 5
// forwards rejected async handlers here) so unhandled errors never leak
// stack traces or crash the process.
app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  logger.error("unhandled request error", error, {
    method: req.method,
    path: req.path,
  });

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({ success: false, error: "Internal server error" });
});

export default app;
