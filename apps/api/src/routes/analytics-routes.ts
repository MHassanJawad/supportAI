// Dashboard analytics routes for tenant usage reporting.
import { Router } from "express";
import { asyncRoute } from "../utils/async-route";
import { getAnalyticsSummary } from "../services/analytics-service";
import { requireBusinessId } from "../services/business-service";
import "../types";

export const analyticsRouter = Router();

analyticsRouter.get(
  "/analytics/summary",
  asyncRoute(async (req, res) => {
    res.json({ data: await getAnalyticsSummary(requireBusinessId(req.context.auth?.businessId)) });
  })
);
