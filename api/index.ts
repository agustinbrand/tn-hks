import type { IncomingMessage, ServerResponse } from "http";
import app from "../packages/server/src/app.js";

type RequestWithMutableUrl = IncomingMessage & { url?: string | null };

export default function handler(
  req: RequestWithMutableUrl,
  res: ServerResponse,
) {
  if (req.url) {
    req.url = req.url.replace(/^\/api/, "") || "/";
  }
  return app(req as any, res as any);
}
