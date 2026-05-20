import express from "express";

import { getDocumentsController } from "./documents.controller";
import { deleteDocumentController } from "./documents.controller";

const router = express.Router();

router.get("/", getDocumentsController);
router.delete("/:id", deleteDocumentController);

export default router;
