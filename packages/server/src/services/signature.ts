import { createHmac } from "node:crypto";
import env from "../config/env.js";

export function verifyLaunchSignature(query: Record<string, string>) {
  const signature = query.signature;
  if (!signature) return false;
  const sorted = Object.entries(query)
    .filter(([key]) => key !== "signature")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const computed = createHmac("sha256", env.APP_CLIENT_SECRET)
    .update(sorted)
    .digest("hex");

  return computed === signature;
}
