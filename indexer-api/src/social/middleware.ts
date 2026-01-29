import { createMiddleware } from "hono/factory";
import type { Session } from "hono-sessions";

/**
 * Variables available in Hono context after auth middleware
 */
export interface AuthVariables {
  address: string;
  session: Session;
}

/**
 * Middleware that requires authentication via SIWE session.
 *
 * - Checks session for 'address' field (set during /auth/verify)
 * - Returns 401 if not authenticated
 * - Sets c.get('address') for downstream handlers
 */
export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const session = c.get("session") as Session | undefined;

    if (!session) {
      return c.json({ error: "Session not available" }, 401);
    }

    const address = session.get("address") as string | undefined;

    if (!address) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    // Make address available to downstream handlers
    c.set("address", address);

    await next();
  }
);
