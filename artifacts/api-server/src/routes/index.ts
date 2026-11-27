import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import healthRouter from "./health";

const router: IRouter = Router();

// Health is always registered and does not depend on DB, Clerk secrets, or AI providers.
router.use(healthRouter);

/**
 * Lazily load OpenAI/DB-backed routes so process startup and /api/healthz
 * do not require DATABASE_URL or AI_INTEGRATIONS_* at import time.
 * If those modules fail to load (missing config), return a clear 503.
 */
let openaiRouter: IRouter | null = null;
let openaiLoadError: string | null = null;
let openaiLoadPromise: Promise<void> | null = null;

async function ensureOpenaiRouter(): Promise<void> {
  if (openaiRouter || openaiLoadError) return;
  if (!openaiLoadPromise) {
    openaiLoadPromise = import("./openai")
      .then((mod) => {
        openaiRouter = mod.default;
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Failed to load API routes";
        openaiLoadError = message;
      });
  }
  await openaiLoadPromise;
}

async function openaiGate(req: Request, res: Response, next: NextFunction) {
  await ensureOpenaiRouter();
  if (openaiLoadError || !openaiRouter) {
    res.status(503).json({
      error:
        "Application API is unavailable because required configuration failed to load (database and/or AI integration).",
      code: "ROUTES_UNAVAILABLE",
      detail: openaiLoadError ?? "unknown",
    });
    return;
  }
  return openaiRouter(req, res, next);
}

router.use(openaiGate);

export default router;
