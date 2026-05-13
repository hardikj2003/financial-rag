import dotenv from "dotenv";
dotenv.config();

import app from "./app";

import { createFinancialCollection } from "./modules/qdrant/qdrant.service";

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  await createFinancialCollection();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();