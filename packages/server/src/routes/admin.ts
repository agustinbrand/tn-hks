import { Router } from "express";
import { z } from "zod";
import env from "../config/env.js";
import { requireSession, RequestWithSession } from "../middleware/require-session.js";
import { getToken } from "../repositories/store-repository.js";
import { TiendanubeClient } from "../services/tiendanube-client.js";
import {
  getBundleConfig,
  listBundleConfigs,
  upsertBundleConfig,
} from "../repositories/bundle-config-repository.js";

const router = Router();

router.use(requireSession);

router.get("/session", async (req, res) => {
  const session = (req as RequestWithSession).session!;
  res.json({
    success: true,
    storeId: session.storeId,
    permanentDomain: session.permanentDomain,
    appUrl: env.APP_URL,
  });
});

router.get("/products", async (req, res) => {
  const session = (req as RequestWithSession).session!;
  const token = await getToken(session.storeId);
  if (!token) {
    return res.status(401).json({ success: false, message: "Store not installed" });
  }

  const client = new TiendanubeClient(session.storeId, token.access_token);
  const products = await client.listProducts({
    page: req.query.page ?? 1,
    per_page: req.query.per_page ?? 20,
    fields: "id,name,price,variants,images",
  });

  res.json({ success: true, data: products });
});

const bundleSchema = z.object({
  mainTitle: z.string(),
  helpText: z.string(),
  buttonText: z.string(),
  addingText: z.string(),
  successMessage: z.string(),
  selectPackError: z.string(),
  selectVariantsError: z.string(),
  packs: z
    .array(
      z.object({
        units: z.number().int().positive(),
        label: z.string(),
        subheadline: z.string().optional(),
        discount: z.number().min(0).max(0.9),
        badges: z.array(z.object({ text: z.string(), className: z.string() })).optional(),
      }),
    )
    .min(1),
  freeShippingThreshold: z.number().nonnegative(),
  freeShippingBadgeText: z.string(),
  complementariesPosition: z.enum(["inside", "bottom"]),
  colors: z.object({
    primary: z.string(),
    primaryHover: z.string(),
    success: z.string(),
  }),
  complementaries: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        title: z.string(),
        image: z.string().nullable(),
      }),
    )
    .optional()
    .default([]),
});

router.get("/bundles", async (req, res) => {
  const session = (req as RequestWithSession).session!;
  const configs = await listBundleConfigs(session.storeId);
  res.json({ success: true, data: configs });
});

router.get("/bundles/:productId", async (req, res) => {
  const session = (req as RequestWithSession).session!;
  const productId = Number.parseInt(req.params.productId, 10);
  if (!productId) {
    return res.status(400).json({ success: false, message: "Invalid product id" });
  }
  const config = await getBundleConfig(session.storeId, productId);
  res.json({ success: true, data: config });
});

router.post("/bundles/:productId", async (req, res) => {
  const session = (req as RequestWithSession).session!;
  const productId = Number.parseInt(req.params.productId, 10);
  if (!productId) {
    return res.status(400).json({ success: false, message: "Invalid product id" });
  }

  const parsed = bundleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid bundle config",
      issues: parsed.error.issues,
    });
  }

  await upsertBundleConfig({
    store_id: session.storeId,
    product_id: productId,
    config: parsed.data,
  });

  res.json({ success: true });
});

export default router;
