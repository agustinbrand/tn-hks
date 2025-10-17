import type { IncomingMessage, ServerResponse } from "http";

let cachedApp: ((req: IncomingMessage, res: ServerResponse) => void) | null = null;

async function resolveApp() {
  if (!cachedApp) {
    const { default: app } = await import("../packages/server/src/app.js");
    cachedApp = app as any;
  }
  return cachedApp;
}

export default async function vercelHandler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  console.log("[api/index] incoming", req.url);
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
    const app = await resolveApp();
    app(req as any, res as any);
  } catch (error) {
    console.error("[api/index] handler error", error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end("Internal server error");
    }
  }
}
