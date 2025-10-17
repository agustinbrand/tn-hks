import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../packages/server/src/app.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.url) {
    req.url = req.url.replace(/^\/api/, "") || "/";
  }
  return app(req, res);
}
