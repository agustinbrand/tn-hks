import serverless from "serverless-http";
import type { IncomingMessage, ServerResponse } from "http";
import app from "../packages/server/src/app.js";

const handler = serverless(app);

export default async function vercelHandler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (req.url) {
    req.url = req.url.replace(/^\/api/, "") || "/";
  }
  try {
    await handler(req as any, res as any);
  } catch (error) {
    console.error("[api/index] handler error", error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end("Internal server error");
    }
  }
}
