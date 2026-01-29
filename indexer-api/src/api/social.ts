import { Hono } from "hono";
import { eq, and, desc, count } from "drizzle-orm";
import { socialDb, schema } from "../social/db.js";
import { requireAuth, type AuthVariables } from "../social/middleware.js";

/**
 * Social API routes
 *
 * Provides REST endpoints for:
 * - User profiles (view/update)
 * - Follow relationships
 * - Comments on markets
 * - Predictions with explanations
 * - Feed of followed users' predictions
 */

const social = new Hono<{ Variables: AuthVariables }>();

// =============================================================================
// Profile Routes
// =============================================================================

/**
 * GET /profiles/:address
 * Get profile by address (public)
 */
social.get("/profiles/:address", async (c) => {
  const address = c.req.param("address").toLowerCase();

  const profile = await socialDb
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.address, address))
    .limit(1);

  if (profile.length === 0) {
    // Return default profile object if not found
    return c.json({
      address,
      displayName: null,
      bio: null,
      createdAt: null,
      updatedAt: null,
    });
  }

  return c.json(profile[0]);
});

/**
 * PUT /profiles
 * Update own profile (authenticated)
 */
social.put("/profiles", requireAuth, async (c) => {
  const address = c.get("address");

  try {
    const body = await c.req.json();
    const { displayName, bio } = body;

    // Validate displayName length (1-50 chars)
    if (displayName !== undefined && displayName !== null) {
      if (typeof displayName !== "string" || displayName.length < 1 || displayName.length > 50) {
        return c.json({ error: "displayName must be 1-50 characters" }, 400);
      }
    }

    // Validate bio length (max 500 chars)
    if (bio !== undefined && bio !== null) {
      if (typeof bio !== "string" || bio.length > 500) {
        return c.json({ error: "bio must be at most 500 characters" }, 400);
      }
    }

    const now = new Date();

    // Upsert profile (insert or update on conflict)
    await socialDb
      .insert(schema.profiles)
      .values({
        address,
        displayName: displayName ?? null,
        bio: bio ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: schema.profiles.address,
        set: {
          displayName: displayName ?? null,
          bio: bio ?? null,
          updatedAt: now,
        },
      });

    // Return updated profile
    const updated = await socialDb
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.address, address))
      .limit(1);

    return c.json(updated[0]);
  } catch (error) {
    console.error("Error updating profile:", error);
    return c.json({ error: "Failed to update profile" }, 500);
  }
});

/**
 * GET /profiles/:address/stats
 * Get follower and following counts for an address (public)
 */
social.get("/profiles/:address/stats", async (c) => {
  const address = c.req.param("address").toLowerCase();

  // Count followers (people following this address)
  const followerResult = await socialDb
    .select({ count: count() })
    .from(schema.follows)
    .where(eq(schema.follows.followingAddress, address));

  // Count following (people this address follows)
  const followingResult = await socialDb
    .select({ count: count() })
    .from(schema.follows)
    .where(eq(schema.follows.followerAddress, address));

  return c.json({
    address,
    followerCount: followerResult[0]?.count ?? 0,
    followingCount: followingResult[0]?.count ?? 0,
  });
});

// =============================================================================
// Follow Routes
// =============================================================================

/**
 * POST /follow/:address
 * Follow a user (authenticated)
 */
social.post("/follow/:address", requireAuth, async (c) => {
  const followerAddress = c.get("address");
  const followingAddress = c.req.param("address").toLowerCase();

  // Prevent self-follow
  if (followerAddress === followingAddress) {
    return c.json({ error: "Cannot follow yourself" }, 400);
  }

  try {
    // Insert follow, ignore if already exists
    await socialDb
      .insert(schema.follows)
      .values({
        followerAddress,
        followingAddress,
        createdAt: new Date(),
      })
      .onConflictDoNothing();

    return c.json({ success: true, following: followingAddress });
  } catch (error) {
    console.error("Error following user:", error);
    return c.json({ error: "Failed to follow user" }, 500);
  }
});

/**
 * DELETE /follow/:address
 * Unfollow a user (authenticated)
 */
social.delete("/follow/:address", requireAuth, async (c) => {
  const followerAddress = c.get("address");
  const followingAddress = c.req.param("address").toLowerCase();

  try {
    await socialDb
      .delete(schema.follows)
      .where(
        and(
          eq(schema.follows.followerAddress, followerAddress),
          eq(schema.follows.followingAddress, followingAddress)
        )
      );

    return c.json({ success: true, unfollowed: followingAddress });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return c.json({ error: "Failed to unfollow user" }, 500);
  }
});

/**
 * GET /followers/:address
 * Get list of followers for an address (public)
 */
social.get("/followers/:address", async (c) => {
  const address = c.req.param("address").toLowerCase();

  const followers = await socialDb
    .select({
      followerAddress: schema.follows.followerAddress,
      displayName: schema.profiles.displayName,
      createdAt: schema.follows.createdAt,
    })
    .from(schema.follows)
    .leftJoin(schema.profiles, eq(schema.follows.followerAddress, schema.profiles.address))
    .where(eq(schema.follows.followingAddress, address))
    .orderBy(desc(schema.follows.createdAt));

  return c.json({
    address,
    followers: followers.map((f) => ({
      address: f.followerAddress,
      displayName: f.displayName,
      followedAt: f.createdAt,
    })),
    count: followers.length,
  });
});

/**
 * GET /following/:address
 * Get list of users this address follows (public)
 */
social.get("/following/:address", async (c) => {
  const address = c.req.param("address").toLowerCase();

  const following = await socialDb
    .select({
      followingAddress: schema.follows.followingAddress,
      displayName: schema.profiles.displayName,
      createdAt: schema.follows.createdAt,
    })
    .from(schema.follows)
    .leftJoin(schema.profiles, eq(schema.follows.followingAddress, schema.profiles.address))
    .where(eq(schema.follows.followerAddress, address))
    .orderBy(desc(schema.follows.createdAt));

  return c.json({
    address,
    following: following.map((f) => ({
      address: f.followingAddress,
      displayName: f.displayName,
      followedAt: f.createdAt,
    })),
    count: following.length,
  });
});

/**
 * GET /is-following/:address
 * Check if current user follows the given address (authenticated)
 */
social.get("/is-following/:address", requireAuth, async (c) => {
  const followerAddress = c.get("address");
  const followingAddress = c.req.param("address").toLowerCase();

  const result = await socialDb
    .select()
    .from(schema.follows)
    .where(
      and(
        eq(schema.follows.followerAddress, followerAddress),
        eq(schema.follows.followingAddress, followingAddress)
      )
    )
    .limit(1);

  return c.json({ isFollowing: result.length > 0 });
});

// =============================================================================
// Comment Routes
// =============================================================================

/**
 * GET /markets/:marketId/comments
 * Get comments for a market (public)
 */
social.get("/markets/:marketId/comments", async (c) => {
  const marketId = c.req.param("marketId").toLowerCase();

  const marketComments = await socialDb
    .select({
      id: schema.comments.id,
      marketId: schema.comments.marketId,
      authorAddress: schema.comments.authorAddress,
      content: schema.comments.content,
      createdAt: schema.comments.createdAt,
      displayName: schema.profiles.displayName,
    })
    .from(schema.comments)
    .leftJoin(schema.profiles, eq(schema.comments.authorAddress, schema.profiles.address))
    .where(eq(schema.comments.marketId, marketId))
    .orderBy(desc(schema.comments.createdAt))
    .limit(100);

  return c.json({
    marketId,
    comments: marketComments.map((comment) => ({
      id: comment.id,
      authorAddress: comment.authorAddress,
      authorDisplayName: comment.displayName,
      content: comment.content,
      createdAt: comment.createdAt,
    })),
    count: marketComments.length,
  });
});

/**
 * POST /markets/:marketId/comments
 * Add comment to market (authenticated)
 */
social.post("/markets/:marketId/comments", requireAuth, async (c) => {
  const marketId = c.req.param("marketId").toLowerCase();
  const authorAddress = c.get("address");

  try {
    const body = await c.req.json();
    const { content } = body;

    // Validate content length (1-1000 chars)
    if (!content || typeof content !== "string" || content.length < 1 || content.length > 1000) {
      return c.json({ error: "content must be 1-1000 characters" }, 400);
    }

    const now = new Date();

    const result = await socialDb
      .insert(schema.comments)
      .values({
        marketId,
        authorAddress,
        content,
        createdAt: now,
      })
      .returning();

    return c.json({
      id: result[0].id,
      marketId,
      authorAddress,
      content,
      createdAt: now,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return c.json({ error: "Failed to create comment" }, 500);
  }
});

// =============================================================================
// Prediction Routes
// =============================================================================

/**
 * GET /markets/:marketId/predictions
 * Get predictions for a market (public)
 */
social.get("/markets/:marketId/predictions", async (c) => {
  const marketId = c.req.param("marketId").toLowerCase();

  const marketPredictions = await socialDb
    .select({
      id: schema.predictions.id,
      marketId: schema.predictions.marketId,
      authorAddress: schema.predictions.authorAddress,
      explanation: schema.predictions.explanation,
      isYes: schema.predictions.isYes,
      createdAt: schema.predictions.createdAt,
      displayName: schema.profiles.displayName,
    })
    .from(schema.predictions)
    .leftJoin(schema.profiles, eq(schema.predictions.authorAddress, schema.profiles.address))
    .where(eq(schema.predictions.marketId, marketId))
    .orderBy(desc(schema.predictions.createdAt));

  return c.json({
    marketId,
    predictions: marketPredictions.map((prediction) => ({
      id: prediction.id,
      authorAddress: prediction.authorAddress,
      authorDisplayName: prediction.displayName,
      explanation: prediction.explanation,
      isYes: prediction.isYes,
      createdAt: prediction.createdAt,
    })),
    count: marketPredictions.length,
  });
});

/**
 * POST /markets/:marketId/predictions
 * Add prediction with explanation (authenticated)
 */
social.post("/markets/:marketId/predictions", requireAuth, async (c) => {
  const marketId = c.req.param("marketId").toLowerCase();
  const authorAddress = c.get("address");

  try {
    const body = await c.req.json();
    const { explanation, isYes } = body;

    // Validate explanation length (1-2000 chars)
    if (!explanation || typeof explanation !== "string" || explanation.length < 1 || explanation.length > 2000) {
      return c.json({ error: "explanation must be 1-2000 characters" }, 400);
    }

    // Validate isYes is a boolean
    if (typeof isYes !== "boolean") {
      return c.json({ error: "isYes must be a boolean" }, 400);
    }

    const now = new Date();

    const result = await socialDb
      .insert(schema.predictions)
      .values({
        marketId,
        authorAddress,
        explanation,
        isYes,
        createdAt: now,
      })
      .returning();

    return c.json({
      id: result[0].id,
      marketId,
      authorAddress,
      explanation,
      isYes,
      createdAt: now,
    });
  } catch (error) {
    console.error("Error creating prediction:", error);
    return c.json({ error: "Failed to create prediction" }, 500);
  }
});

/**
 * GET /profiles/:address/predictions
 * Get all predictions by a user (public)
 */
social.get("/profiles/:address/predictions", async (c) => {
  const address = c.req.param("address").toLowerCase();

  const userPredictions = await socialDb
    .select({
      id: schema.predictions.id,
      marketId: schema.predictions.marketId,
      authorAddress: schema.predictions.authorAddress,
      explanation: schema.predictions.explanation,
      isYes: schema.predictions.isYes,
      createdAt: schema.predictions.createdAt,
    })
    .from(schema.predictions)
    .where(eq(schema.predictions.authorAddress, address))
    .orderBy(desc(schema.predictions.createdAt));

  return c.json({
    address,
    predictions: userPredictions,
    count: userPredictions.length,
  });
});

// =============================================================================
// Feed Route
// =============================================================================

/**
 * GET /feed
 * Get predictions from followed users (authenticated)
 */
social.get("/feed", requireAuth, async (c) => {
  const userAddress = c.get("address");

  const feedPredictions = await socialDb
    .select({
      id: schema.predictions.id,
      marketId: schema.predictions.marketId,
      authorAddress: schema.predictions.authorAddress,
      explanation: schema.predictions.explanation,
      isYes: schema.predictions.isYes,
      createdAt: schema.predictions.createdAt,
      displayName: schema.profiles.displayName,
    })
    .from(schema.predictions)
    .innerJoin(
      schema.follows,
      and(
        eq(schema.predictions.authorAddress, schema.follows.followingAddress),
        eq(schema.follows.followerAddress, userAddress)
      )
    )
    .leftJoin(schema.profiles, eq(schema.predictions.authorAddress, schema.profiles.address))
    .orderBy(desc(schema.predictions.createdAt))
    .limit(50);

  return c.json({
    predictions: feedPredictions.map((prediction) => ({
      id: prediction.id,
      marketId: prediction.marketId,
      authorAddress: prediction.authorAddress,
      authorDisplayName: prediction.displayName,
      explanation: prediction.explanation,
      isYes: prediction.isYes,
      createdAt: prediction.createdAt,
    })),
    count: feedPredictions.length,
  });
});

export default social;
