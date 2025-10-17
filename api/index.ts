import type { IncomingMessage, ServerResponse } from "http";
import app from "../packages/server/src/app.js";

type RequestWithMutableUrl = IncomingMessage & { url?: string | null };

export default function handler(
  req: RequestWithMutableUrl,
  res: ServerResponse,
) {
  const originalUrl = req.url;
  const matchedPath = (req.headers["x-vercel-matched-path"] as string) || "";
  const rewriteUrl = (req.headers["x-vercel-rewrite-url"] as string) || "";
  console.log("[api/index]", { originalUrl, matchedPath, rewriteUrl, query: (req as any).query });
  if (req.url) {
    req.url = req.url.replace(/^\/api/, "") || "/";
  }
  return app(req as any, res as any);
}
