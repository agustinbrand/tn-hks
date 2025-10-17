import express from "express";
import cors from "cors";
import "express-async-errors";
import bodyParser from "body-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import env from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import logger from "./lib/logger.js";
import authRouter from "./routes/auth.js";
import adminRouter from "./routes/admin.js";
import publicRouter from "./routes/public.js";
import webhookRouter from "./routes/webhooks.js";

const app = express();

app.use(
  bodyParser.json({
    verify: (req, _res, buf) => {
      (req as express.Request & { rawBody?: Buffer }).rawBody = Buffer.from(buf);
    },
  }),
);
app.use(
  bodyParser.urlencoded({
    extended: true,
    verify: (req, _res, buf) => {
      (req as express.Request & { rawBody?: Buffer }).rawBody = Buffer.from(buf);
    },
  }),
);

app.use(
  cors({
    origin: env.APP_URL,
    credentials: true,
  }),
);

app.get("/health", (_req, res) => {
  res.json({ success: true, status: "ok" });
});

app.use("/auth", authRouter);
app.use("/api", adminRouter);
app.use("/public", publicRouter);
app.use("/webhooks", webhookRouter);

const dirname = path.dirname(fileURLToPath(import.meta.url));
const storefrontDist = path.join(dirname, "../../storefront/dist");
app.use(
  "/assets",
  express.static(storefrontDist, {
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "public,max-age=604800,immutable");
    },
  }),
);

const adminDist = path.join(dirname, "../../admin/dist");
if (fs.existsSync(adminDist)) {
  app.use(
    "/admin",
    express.static(adminDist, {
      index: "index.html",
      setHeaders: (res) => {
        res.setHeader("Cache-Control", "no-store");
      },
    }),
  );
  app.get("/admin/*", (_req, res) => {
    res.sendFile(path.join(adminDist, "index.html"));
  });
}

app.use(errorHandler);

process.on("unhandledRejection", (err) => {
  logger.error({ err }, "Unhandled promise rejection");
});

export default app;
