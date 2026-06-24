import { Request, Response } from "express";
import {
  getDashboardSummary,
  getTimeseries,
  listTraces,
  getTraceById,
} from "./observability.service";
import { logger } from "../../config/logger";

export const summaryController = async (_req: Request, res: Response) => {
  try {
    res.json({ success: true, summary: await getDashboardSummary() });
  } catch (error) {
    logger.error("observability summary failed", error);
    res.status(500).json({ success: false });
  }
};

export const timeseriesController = async (req: Request, res: Response) => {
  try {
    const days = Math.min(90, Math.max(1, Number(req.query.days) || 14));
    res.json({ success: true, series: await getTimeseries(days) });
  } catch (error) {
    logger.error("observability timeseries failed", error);
    res.status(500).json({ success: false });
  }
};

export const tracesController = async (req: Request, res: Response) => {
  try {
    const result = await listTraces({
      page: Math.max(1, Number(req.query.page) || 1),
      pageSize: Math.min(100, Math.max(1, Number(req.query.pageSize) || 20)),
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      status: typeof req.query.status === "string" ? req.query.status : undefined,
      verification:
        typeof req.query.verification === "string"
          ? req.query.verification
          : undefined,
      queryType:
        typeof req.query.queryType === "string" ? req.query.queryType : undefined,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    logger.error("observability traces failed", error);
    res.status(500).json({ success: false });
  }
};

export const traceDetailController = async (req: Request, res: Response) => {
  try {
    const trace = await getTraceById(req.params.id as string);
    if (!trace) {
      return res.status(404).json({ success: false, error: "Trace not found" });
    }
    res.json({ success: true, trace });
  } catch (error) {
    logger.error("observability trace detail failed", error);
    res.status(500).json({ success: false });
  }
};
