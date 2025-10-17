import { Router } from "express";
import env from "../config/env.js";
import logger from "../lib/logger.js";
import {
  getToken,
  saveToken,
  upsertStore,
} from "../repositories/store-repository.js";
import { migrate } from "../lib/db.js";
import {
  exchangeOAuthCode,
  fetchCurrentStore,
  TiendanubeClient,
} from "../services/tiendanube-client.js";
import { signSession, verifySession } from "../services/session.js";
import { ensureScriptTag } from "../services/script-tag-service.js";
import { registerWebhooks } from "../services/webhook-service.js";
import { verifyLaunchSignature } from "../services/signature.js";

const router = Router();

router.get("/install", async (req, res) => {
  const storeId = Number.parseInt(String(req.query.store_id ?? ""), 10);
  const permanentDomain = String(req.query.permanent_domain ?? "");

  if (!storeId || !permanentDomain) {
    return res.status(400).send("Missing store parameters");
  }

  const token = await getToken(storeId);
  if (token) {
    logger.info({ storeId }, "Store already installed, redirecting to admin");
    const session = signSession({ storeId, permanentDomain });
    return res.redirect(`${env.APP_URL}/admin?session=${session}`);
  }

  const state = signSession({ storeId, permanentDomain });

  const authorizeUrl = new URL(
    `https://www.tiendanube.com/apps/authorize/${env.APP_CLIENT_ID}`,
  );
  authorizeUrl.searchParams.set("client_id", env.APP_CLIENT_ID);
  authorizeUrl.searchParams.set("scope", env.APP_SCOPES);
  authorizeUrl.searchParams.set("redirect_uri", env.APP_REDIRECT_URI);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("state", state);

  return res.redirect(authorizeUrl.toString());
});

router.get("/callback", async (req, res) => {
  const { code, store_id: storeIdRaw, state } = req.query;
  if (!code) {
    return res.status(400).send("Missing OAuth params");
  }

  logger.info({ state, storeIdRaw }, "OAuth callback received");

  let session: { storeId: number; permanentDomain: string } | null = null;
  if (state) {
    try {
      session = verifySession(String(state));
    } catch (err) {
      logger.warn({ err }, "Invalid OAuth state");
      session = null;
    }
  }

  const storeIdFromQuery = storeIdRaw ? Number.parseInt(String(storeIdRaw), 10) : null;

  try {
    logger.info({ storeIdFromQuery, statePresent: Boolean(state) }, "Running database migrations");
    await migrate();

    logger.info({ storeIdFromQuery }, "Exchanging OAuth code");
    const token = await exchangeOAuthCode({ code: String(code) });
    logger.info(
      { tokenKeys: Object.keys(token), tokenStoreId: token.store_id },
      "Token exchanged",
    );

    let normalizedStoreId =
      storeIdFromQuery ?? session?.storeId ?? (token as any).store_id ?? null;

    if (!normalizedStoreId) {
      logger.info("Fetching current store from /me endpoint");
      const currentStore = await fetchCurrentStore(token.access_token);
      normalizedStoreId = currentStore.id;
      if (!session) {
        session = {
          storeId: currentStore.id,
          permanentDomain: currentStore.permanent_domain ?? currentStore.domain ?? "",
        };
      }
    }

    if (!normalizedStoreId) {
      logger.error({ storeIdFromQuery }, "Missing store id after fallback");
      return res.status(400).send("Missing store information");
    }

    await saveToken({
      storeId: normalizedStoreId,
      accessToken: token.access_token,
      scope: token.scope,
    });

    logger.info({ storeId: normalizedStoreId }, "Fetching store info");
    const client = new TiendanubeClient(normalizedStoreId, token.access_token);
    const store = await client.getStore();
    await upsertStore({
      store_id: normalizedStoreId,
      permanent_domain:
        session?.permanentDomain ?? store.permalink ?? store.domain ?? "",
      name: store.name,
      country: store.country,
    });

    await ensureScriptTag(client, normalizedStoreId);
    await registerWebhooks(client, normalizedStoreId);

    const sessionToken = signSession({
      storeId: normalizedStoreId,
      permanentDomain:
        session?.permanentDomain ?? store.permalink ?? store.domain ?? "",
    });

    logger.info({ storeId: normalizedStoreId }, "OAuth callback completed successfully");
    return res.redirect(`${env.APP_URL}/admin?session=${sessionToken}`);
  } catch (error) {
    logger.error({ error, storeIdFromQuery, statePresent: Boolean(state) }, "OAuth callback failure");
    return res.status(500).send("Failed to install app. Check logs.");
  }
});

router.get("/launch", async (req, res) => {
  const params = Object.fromEntries(
    Object.entries(req.query).map(([key, value]) => [key, String(value)]),
  );
  if (!verifyLaunchSignature(params)) {
    return res.status(401).json({ success: false, message: "Invalid signature" });
  }

  const storeId = Number.parseInt(params.store_id ?? "", 10);
  const permanentDomain = params.permanent_domain;
  if (!storeId || !permanentDomain) {
    return res.status(400).json({ success: false, message: "Missing store data" });
  }

  const sessionToken = signSession({ storeId, permanentDomain });
  res.json({ success: true, token: sessionToken });
});

export default router;
