import axios from "axios";
import env from "../config/env.js";
import logger from "../lib/logger.js";
import { TiendanubeClient } from "./tiendanube-client.js";

const SCRIPT_IDENTIFIER = "codex-bundle-app";

export async function ensureScriptTag(
  client: TiendanubeClient,
  storeId: number,
) {
  const tags = await client.listScriptTags();
  const existing = tags.find(
    (tag: { src: string }) => tag.src && tag.src.includes(SCRIPT_IDENTIFIER),
  );
  if (existing) {
    logger.info({ storeId }, "Script tag already present");
    return existing;
  }

  const src = `${env.APP_URL}/public/bundle.js?store_id=${storeId}&v=${Date.now()}`;
  try {
    const created = await client.createScriptTag({
      src,
      event: "onload",
      where: "storefront",
    });
    logger.info({ storeId, scriptTagId: created.id }, "Script tag created");
    return created;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      logger.warn(
        {
          storeId,
          status: error.response.status,
          data: error.response.data,
        },
        "Missing write_scripts permission, skipping script tag creation",
      );
      return null;
    }
    throw error;
  }
}
