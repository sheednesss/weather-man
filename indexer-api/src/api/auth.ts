import { Hono } from "hono";
import { sessionMiddleware, CookieStore, type Session } from "hono-sessions";
import { generateNonce, SiweMessage } from "siwe";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

/**
 * SIWE (Sign-In With Ethereum) authentication routes
 *
 * Provides wallet-based authentication using Ethereum signatures.
 * Sessions are stored in encrypted cookies.
 */

type AuthVariables = {
  session: Session;
};

const auth = new Hono<{ Variables: AuthVariables }>();

// Create viem public client for signature verification
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

// Get session secret from environment (must be 32+ characters)
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32) {
  console.warn(
    "WARNING: SESSION_SECRET not set or too short. Using development default. Set SESSION_SECRET env var (32+ chars) in production."
  );
}

// Configure session middleware with cookie store
const store = new CookieStore();
auth.use(
  "*",
  sessionMiddleware({
    store,
    encryptionKey: sessionSecret || "dev-session-secret-must-be-32-chars!",
    cookieOptions: {
      sameSite: "Lax",
      path: "/",
      httpOnly: true,
    },
  })
);

/**
 * GET /auth/nonce
 *
 * Generate a new nonce for SIWE message signing.
 * Nonce is stored in session to prevent replay attacks.
 */
auth.get("/nonce", async (c) => {
  const session = c.get("session");
  const nonce = generateNonce();

  session.set("nonce", nonce);

  return c.json({ nonce });
});

/**
 * POST /auth/verify
 *
 * Verify a signed SIWE message and establish session.
 * Request body: { message: string, signature: string }
 */
auth.post("/verify", async (c) => {
  const session = c.get("session");

  try {
    const body = await c.req.json();
    const { message, signature } = body;

    if (!message || !signature) {
      return c.json({ error: "Missing message or signature" }, 400);
    }

    // Parse the SIWE message
    const siweMessage = new SiweMessage(message);

    // Verify nonce matches session
    const sessionNonce = session.get("nonce") as string | undefined;
    if (!sessionNonce || siweMessage.nonce !== sessionNonce) {
      return c.json({ error: "Invalid nonce" }, 400);
    }

    // Verify signature using viem
    const address = siweMessage.address;
    const valid = await publicClient.verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });

    if (!valid) {
      return c.json({ error: "Invalid signature" }, 401);
    }

    // Clear nonce and set authenticated address (lowercase for consistency)
    session.set("nonce", null);
    session.set("address", address.toLowerCase());

    return c.json({
      success: true,
      address: address.toLowerCase(),
    });
  } catch (error) {
    console.error("SIWE verification error:", error);
    return c.json({ error: "Verification failed" }, 400);
  }
});

/**
 * GET /auth/session
 *
 * Get current session status.
 * Returns { address: string } if authenticated, { address: null } otherwise.
 */
auth.get("/session", async (c) => {
  const session = c.get("session");
  const address = session.get("address") as string | undefined;

  return c.json({ address: address || null });
});

/**
 * POST /auth/logout
 *
 * Clear the authenticated session.
 */
auth.post("/logout", async (c) => {
  const session = c.get("session");

  session.set("address", null);
  session.set("nonce", null);

  return c.json({ success: true });
});

export default auth;
