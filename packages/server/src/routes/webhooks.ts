import { Router } from "express";
import { verifyWebhook } from "../middleware/verify-webhook.js";
import logger from "../lib/logger.js";
import { deleteStore } from "../repositories/store-repository.js";

const router = Router();

router.use(verifyWebhook);

router.post("/app-uninstalled", async (req, res) => {
  const storeId = Number.parseInt(String(req.body?.store_id ?? ""), 10);
  if (storeId) {
    await deleteStore(storeId);
    logger.info({ storeId }, "Store uninstalled app");
  }
  res.json({ success: true });
});

router.post("/products-update", async (req, res) => {
  const storeId = Number.parseInt(String(req.body?.store_id ?? ""), 10);
  logger.info(
    { storeId, payload: req.body },
    "Product update webhook received",
  );
  res.json({ success: true });
});

router.post("/products-create", async (req, res) => {
  const storeId = Number.parseInt(String(req.body?.store_id ?? ""), 10);
  logger.info({ storeId }, "Product create webhook received");
  res.json({ success: true });
});

router.post("/products-delete", async (req, res) => {
  const storeId = Number.parseInt(String(req.body?.store_id ?? ""), 10);
  logger.info({ storeId }, "Product delete webhook received");
  res.json({ success: true });
});

router.post("/store-redact", async (req, res) => {
  const storeId = Number.parseInt(String(req.body?.store_id ?? ""), 10);
  logger.info({ storeId }, "Store redact webhook received");
  res.json({ success: true });
});

router.post("/customers-redact", async (req, res) => {
  const storeId = Number.parseInt(String(req.body?.store_id ?? ""), 10);
  const customer = req.body?.data ?? null;
  logger.info({ storeId, customer }, "Customers redact webhook received");
  res.json({ success: true });
});

router.post("/customers-data_request", async (req, res) => {
  const storeId = Number.parseInt(String(req.body?.store_id ?? ""), 10);
  const customers = req.body?.data ?? null;
  logger.info({ storeId, customers }, "Customers data request webhook received");
  res.json({ success: true });
});

export default router;
