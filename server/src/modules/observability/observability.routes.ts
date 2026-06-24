import express from "express";
import { protectRoute } from "../../middleware/helper.middleware";
import { requireAdmin } from "../../middleware/admin.middleware";
import {
  summaryController,
  timeseriesController,
  tracesController,
  traceDetailController,
} from "./observability.controller";

const router = express.Router();

// All observability data is admin-only.
router.get("/summary", protectRoute, requireAdmin, summaryController);
router.get("/timeseries", protectRoute, requireAdmin, timeseriesController);
router.get("/traces", protectRoute, requireAdmin, tracesController);
router.get("/traces/:id", protectRoute, requireAdmin, traceDetailController);

export default router;
