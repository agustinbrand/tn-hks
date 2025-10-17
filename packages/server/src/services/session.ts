import jwt from "jsonwebtoken";
import env from "../config/env.js";

export type SessionPayload = {
  storeId: number;
  permanentDomain: string;
};

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, env.SESSION_JWT_SECRET, { expiresIn: "12h" });
}

export function verifySession(token: string): SessionPayload {
  return jwt.verify(token, env.SESSION_JWT_SECRET) as SessionPayload;
}
