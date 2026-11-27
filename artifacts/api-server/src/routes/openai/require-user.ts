/**
 * Shared Clerk auth gate for OpenAI-related routes.
 * Matches the pattern used in conversations.ts:
 *   const { userId } = getAuth(req);
 *   if (!userId) { res.status(401).json({ error: "Unauthorized" }); ... }
 *
 * Never trust a user id from the request body or query string.
 */
import type { Request, Response } from "express";
import { getAuth } from "@clerk/express";

/**
 * Returns the authenticated Clerk userId, or null after sending 401.
 */
export function requireUserId(req: Request, res: Response): string | null {
  if (!process.env.CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    return "guest-local";
  }
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return userId;
}
