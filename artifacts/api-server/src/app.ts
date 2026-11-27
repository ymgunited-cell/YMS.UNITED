import fs from "node:fs";
import path from "node:path";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import router from "./routes";
import { logger } from "./lib/logger";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
} from "./middlewares/clerkProxyMiddleware";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(cors({ credentials: true, origin: true }));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

if (process.env.CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY) {
  app.use(
    clerkMiddleware({
      publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    }),
  );
} else {
  logger.warn("Clerk keys not set — running API auth in local guest fallback mode");
}

app.use("/api", router);

const candidatePublicDirs = [
  path.resolve(import.meta.dirname ?? process.cwd(), "../../yms-ai/dist/public"),
  path.resolve(process.cwd(), "artifacts/yms-ai/dist/public"),
  path.resolve(process.cwd(), "../yms-ai/dist/public"),
];
const frontendDir = candidatePublicDirs.find((dir) =>
  fs.existsSync(path.join(dir, "index.html")),
);

if (frontendDir) {
  app.use(express.static(frontendDir));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(frontendDir, "index.html"));
  });
}

export default app;
