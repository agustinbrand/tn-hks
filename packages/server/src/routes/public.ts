import { Router } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getBundleConfig } from "../repositories/bundle-config-repository.js";
import { getToken } from "../repositories/store-repository.js";
import { TiendanubeClient } from "../services/tiendanube-client.js";

const router = Router();

router.get("/bundle.js", (_req, res) => {
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const filePath = path.join(dirname, "../../../storefront/dist/bundle.js");
  res.setHeader("Content-Type", "application/javascript");
  res.sendFile(filePath);
});

router.get("/config", async (req, res) => {
  const storeId = Number.parseInt(String(req.query.store_id ?? ""), 10);
  const productId = Number.parseInt(String(req.query.product_id ?? ""), 10);
  if (!storeId || !productId) {
    return res.status(400).json({ success: false, message: "Missing identifiers" });
  }

  const config = await getBundleConfig(storeId, productId);
  if (!config) {
    return res.status(404).json({ success: false, message: "Bundle not configured" });
  }

  const token = await getToken(storeId);
  if (!token) {
    return res.status(401).json({ success: false, message: "Store not installed" });
  }

  const client = new TiendanubeClient(storeId, token.access_token);

  const complementaries = Array.isArray(config.complementaries)
    ? await Promise.all(
        (config.complementaries as { productId: number }[]).map(async (comp) => {
          try {
            const product = await client.getProduct(comp.productId);
            return {
              id: product.id,
              name: product.name?.es || product.name?.pt || product.name?.en || "Complementario",
              price: product.price,
              compare_at_price: product.compare_at_price,
              images: product.images,
              variants: product.variants?.filter((variant: any) => variant.available),
            };
          } catch {
            return null;
          }
        }),
      )
    : [];

  res.json({
    success: true,
    data: {
      ...config,
      complementaries: complementaries.filter(Boolean),
    },
  });
});

export default router;
