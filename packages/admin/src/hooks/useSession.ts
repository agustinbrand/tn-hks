import { useEffect, useState } from "react";
import { createApiClient } from "../api/client";

type SessionState =
  | { status: "loading" }
  | { status: "ready"; storeId: number; permanentDomain: string; appUrl: string }
  | { status: "error"; message: string };

export function useSession() {
  const [state, setState] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    async function fetchSession() {
      try {
        const api = await createApiClient();
        const { data } = await api.get("/session");
        setState({
          status: "ready",
          storeId: data.storeId,
          permanentDomain: data.permanentDomain,
          appUrl: data.appUrl,
        });
      } catch (err) {
        setState({
          status: "error",
          message:
            err instanceof Error ? err.message : "No pudimos cargar la sesión",
        });
      }
    }
    fetchSession();
  }, []);

  return state;
}
