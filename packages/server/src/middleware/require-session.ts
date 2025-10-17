import type { NextFunction, Request, Response } from "express";
import { verifySession } from "../services/session.js";

export type RequestWithSession = Request & {
  session?: {
    storeId: number;
    permanentDomain: string;
  };
};

export function requireSession(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const header = req.get("Authorization");
  if (!header) {
    return res.status(401).json({ success: false, message: "Missing session" });
  }

  const [, token] = header.split(" ");
  if (!token) {
    return res.status(401).json({ success: false, message: "Missing session" });
  }

  try {
    const payload = verifySession(token);
    (req as RequestWithSession).session = payload;
    return next();
  } catch (_err) {
    return res.status(401).json({ success: false, message: "Invalid session" });
  }
}
