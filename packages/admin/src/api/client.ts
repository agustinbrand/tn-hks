import axios from "axios";

const STORAGE_KEY = "codex-bundle-session";

async function requestLaunchToken(): Promise<string | null> {
  const params = new URLSearchParams(window.location.search);
  if (!params.get("signature")) return null;
  const res = await fetch(`/auth/launch?${params.toString()}`);
  if (!res.ok) return null;
  const body = await res.json();
  if (body?.success && body?.token) {
    return body.token as string;
  }
  return null;
}

export async function getSessionToken(): Promise<string> {
  const params = new URLSearchParams(window.location.search);
  const sessionParam = params.get("session");
  if (sessionParam) {
    localStorage.setItem(STORAGE_KEY, sessionParam);
    params.delete("session");
    const base =
      window.location.pathname +
      (params.size > 0 ? `?${params.toString()}` : "");
    window.history.replaceState({}, "", base);
    return sessionParam;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return stored;

  const token = await requestLaunchToken();
  if (token) {
    localStorage.setItem(STORAGE_KEY, token);
    return token;
  }

  throw new Error("Unable to authenticate session");
}

export async function createApiClient() {
  const token = await getSessionToken();
  return axios.create({
    baseURL: "/api",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
