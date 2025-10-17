import type { NextFunction, Request, Response } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import env from "../config/env.js";

export function verifyWebhook(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const signature = req.get("X-Tiendanube-Hmac-Sha256");
  if (!signature) {
    return res.status(401).json({ success: false, message: "Missing signature" });
  }

  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!rawBody) {
    return res.status(400).json({ success: false, message: "Missing raw body" });
  }

  const computed = createHmac("sha256", env.APP_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("base64");

  const isValid =
    computed.length === signature.length &&
    timingSafeEqual(Buffer.from(computed), Buffer.from(signature));

  if (!isValid) {
    return res.status(401).json({ success: false, message: "Invalid signature" });
  }

  return next();
}
