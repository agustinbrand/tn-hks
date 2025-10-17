import serverless from "serverless-http";
import type { IncomingMessage, ServerResponse } from "http";

let cachedHandler: ReturnType<typeof serverless> | null = null;

async function resolveHandler() {
  if (!cachedHandler) {
    const { default: app } = await import("../packages/server/src/app.js");
    cachedHandler = serverless(app);
  }
  return cachedHandler;
}

export default async function vercelHandler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (req.url) {
    const url = new URL(req.url, "http://localhost");
    const pathParam = url.searchParams.get("path");
    if (pathParam) {
      url.searchParams.delete("path");
      const search = url.searchParams.toString();
      req.url = `/${pathParam}${search ? `?${search}` : ""}`;
    } else {
      req.url = req.url.replace(/^\/api/, "") || "/";
    }
  }
  try {
    const handler = await resolveHandler();
    await handler(req as any, res as any);
  } catch (error) {
    console.error("[api/index] handler error", error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end("Internal server error");
    }
  }
}
