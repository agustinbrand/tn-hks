import type { NextFunction, Request, Response } from "express";
import logger from "../lib/logger.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  logger.error({ err }, "Unhandled error");
  const status = typeof err === "object" && err !== null && "status" in err
    ? Number((err as { status?: number }).status)
    : 500;
  res.status(Number.isFinite(status) ? status : 500).json({
    success: false,
    message: err instanceof Error ? err.message : "Internal server error",
  });
}
