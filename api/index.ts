import serverless from "serverless-http";
import type { IncomingMessage, ServerResponse } from "http";
import app from "../packages/server/src/app.js";

const handler = serverless(app);

export default function vercelHandler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (req.url) {
    req.url = req.url.replace(/^\/api/, "") || "/";
  }
  return handler(req as any, res as any);
}
