import express from "express";
import { protectRoute } from "../../middleware/helper.middleware";
import { requireAdmin } from "../../middleware/admin.middleware";
import {
  adminMeController,
  dashboardMetricsController,
  deleteDocumentController,
  documentsController,
} from "./admin.controller";
const router = express.Router();

router.get("/me", protectRoute, adminMeController);
router.get(
  "/dashboard",
  protectRoute,
  requireAdmin,
  dashboardMetricsController,
);
router.get("/documents", protectRoute, requireAdmin, documentsController);
router.delete(
  "/documents/:id",
  protectRoute,
  requireAdmin,
  deleteDocumentController,
);

export default router;
