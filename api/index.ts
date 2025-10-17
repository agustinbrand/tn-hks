import type { IncomingMessage, ServerResponse } from "http";
import app from "../packages/server/src/app.js";

type RequestWithMutableUrl = IncomingMessage & { url?: string | null };

export default function handler(
  req: RequestWithMutableUrl,
  res: ServerResponse,
) {
  const currentUrl = req.url ?? "/";
  const parsed = new URL(currentUrl, "http://localhost");
  const pathParam = parsed.searchParams.get("path");
  if (pathParam) {
    parsed.searchParams.delete("path");
    const search = parsed.searchParams.toString();
    req.url = `/${pathParam}${search ? `?${search}` : ""}`;
  } else if (req.url) {
    req.url = req.url.replace(/^\/api/, "") || "/";
  }

  return app(req as any, res as any);
}
