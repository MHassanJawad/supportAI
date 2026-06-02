// Middleware that attaches a stable request identifier to every request.
import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import "../types";

export function requestContext(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.header("x-request-id") ?? `req_${randomUUID()}`;
  req.context = { requestId };
  res.setHeader("x-request-id", requestId);
  next();
}
