// Profile and business routes for authenticated SupportAI users.
import { Router } from "express";
import { createBusinessSchema } from "@supportai/shared";
import { asyncRoute } from "../utils/async-route";
import { createBusiness, getProfile } from "../services/business-service";
import "../types";

export const profileRouter = Router();

profileRouter.get(
  "/profile",
  asyncRoute(async (req, res) => {
    res.json({ data: await getProfile(req.context.auth!.userId) });
  })
);

profileRouter.post(
  "/businesses",
  asyncRoute(async (req, res) => {
    const input = createBusinessSchema.parse(req.body);
    const business = await createBusiness(input, req.context.auth!.userId);
    res.status(201).json({ data: business });
  })
);
