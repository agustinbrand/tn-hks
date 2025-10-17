import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z
    .string()
    .default("3000")
    .transform((value) => Number.parseInt(value, 10)),
  APP_URL: z.string().url(),
  APP_CLIENT_ID: z.string(),
  APP_CLIENT_SECRET: z.string(),
  APP_SCOPES: z.string().default("read_products,write_scripts"),
  APP_REDIRECT_URI: z.string().url(),
  APP_WEBHOOK_SECRET: z.string(),
  DATABASE_URL: z.string().url(),
  SESSION_JWT_SECRET: z.string().min(32),
});

const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  APP_URL: process.env.APP_URL,
  APP_CLIENT_ID: process.env.APP_CLIENT_ID,
  APP_CLIENT_SECRET: process.env.APP_CLIENT_SECRET,
  APP_SCOPES: process.env.APP_SCOPES,
  APP_REDIRECT_URI: process.env.APP_REDIRECT_URI,
  APP_WEBHOOK_SECRET: process.env.APP_WEBHOOK_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  SESSION_JWT_SECRET: process.env.SESSION_JWT_SECRET,
});

export default env;
