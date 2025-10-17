import axios, { AxiosInstance } from "axios";
import qs from "qs";
import env from "../config/env.js";
import logger from "../lib/logger.js";

export type TiendanubeStoreInfo = {
  id: number;
  name: string;
  permalink: string;
  main_language: string;
  domain: string | null;
  country: string;
};

export type TiendanubeTokenResponse = {
  access_token: string;
  token_type: string;
  scope: string;
};

export type TiendanubeCurrentStore = {
  id: number;
  name: string;
  permanent_domain: string;
  domain: string | null;
  country: string;
};

export class TiendanubeClient {
  private readonly http: AxiosInstance;

  constructor(private readonly storeId: number, accessToken: string) {
    this.http = axios.create({
      baseURL: `https://api.tiendanube.com/v1/${storeId}`,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Codex Bundle App (codex@example.com)",
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: 15000,
    });
  }

  async getStore(): Promise<TiendanubeStoreInfo> {
    const { data } = await this.http.get<TiendanubeStoreInfo>("/store");
    return data;
  }

  async listProducts(params: Record<string, unknown>) {
    const { data } = await this.http.get("/products", { params });
    return data;
  }

  async getProduct(productId: number) {
    const { data } = await this.http.get(`/products/${productId}`);
    return data;
  }

  async createScriptTag(payload: {
    src: string;
    event: "onload";
    where: "storefront";
  }) {
    const { data } = await this.http.post("/script_tags", payload);
    return data;
  }

  async deleteScriptTag(scriptTagId: number) {
    await this.http.delete(`/script_tags/${scriptTagId}`);
  }

  async listScriptTags() {
    const { data } = await this.http.get("/script_tags");
    return data;
  }

  async createWebhook(payload: {
    event: string;
    url: string;
    format?: string;
  }) {
    const { data } = await this.http.post("/webhooks", payload);
    return data;
  }

  async deleteWebhook(id: number) {
    await this.http.delete(`/webhooks/${id}`);
  }
}

export async function fetchCurrentStore(
  accessToken: string,
): Promise<TiendanubeCurrentStore> {
  const { data } = await axios.get<TiendanubeCurrentStore>(
    "https://api.tiendanube.com/v1/me",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "Codex Bundle App (codex@example.com)",
      },
      timeout: 15000,
    },
  );

  return data;
}

export async function exchangeOAuthCode(params: {
  code: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
}): Promise<TiendanubeTokenResponse> {
  const { code, clientId, clientSecret, redirectUri } = params;
  const body = qs.stringify({
    client_id: clientId ?? env.APP_CLIENT_ID,
    client_secret: clientSecret ?? env.APP_CLIENT_SECRET,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri ?? env.APP_REDIRECT_URI,
  });

  const { data } = await axios.post<TiendanubeTokenResponse>(
    "https://www.tiendanube.com/apps/authorize/token",
    body,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 15000,
    },
  );

  logger.info({ scope: data.scope }, "Token exchanged");
  return data;
}
