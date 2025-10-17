import env from "../config/env.js";
import logger from "../lib/logger.js";
import { TiendanubeClient } from "./tiendanube-client.js";

const EVENTS = [
  "app/uninstalled",
  "products/create",
  "products/update",
  "products/delete",
  "store/redact",
  "customers/redact",
  "customers/data_request",
];

export async function registerWebhooks(
  client: TiendanubeClient,
  storeId: number,
) {
  for (const event of EVENTS) {
    await client.createWebhook({
      event,
      url: `${env.APP_URL}/webhooks/${event.replace("/", "-")}`,
      format: "json",
    });
    logger.info({ storeId, event }, "Webhook registered");
  }
}
