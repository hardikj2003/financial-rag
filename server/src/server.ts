import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { createFinancialCollection } from "./modules/qdrant/qdrant.service";
import { logger } from "./config/logger";
import prisma from "./config/prisma";

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  await createFinancialCollection();

  const server = app.listen(PORT, () => {
    logger.info("server started", { port: Number(PORT) });
  });

  const shutdown = (signal: string) => {
    logger.info("shutting down", { signal });

    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });

    // Force-exit if connections refuse to drain.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

startServer().catch((error) => {
  logger.error("server failed to start", error);
  process.exit(1);
});
