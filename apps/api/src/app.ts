// Express application composition for the SupportAI API.
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { allowedOrigins, env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import { requestContext } from "./middleware/request-context";
import { requireAuth } from "./middleware/auth";
import { analyticsRouter } from "./routes/analytics-routes";
import { chatRouter } from "./routes/chat-routes";
import { documentRouter } from "./routes/document-routes";
import { faqRouter } from "./routes/faq-routes";
import { profileRouter } from "./routes/profile-routes";

export function createApp() {
  const app = express();

  app.use(requestContext);
  app.use(helmet());
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  app.get("/health", (_req, res) => {
    res.json({ data: { status: "ok", service: "supportai-api" } });
  });

  const api = express.Router();
  api.use(requireAuth);
  api.use(profileRouter);
  api.use(documentRouter);
  api.use(faqRouter);
  api.use(chatRouter);
  api.use(analyticsRouter);

  app.use("/api/v1", api);
  app.use(errorHandler);

  return app;
}
