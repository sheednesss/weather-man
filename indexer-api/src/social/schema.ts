import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";

/**
 * Social database schema for Weather Man
 *
 * Stores user profiles, follows, comments, and predictions.
 * IMPORTANT: All addresses are stored as lowercase for consistency.
 */

/**
 * User profiles
 * - address is the primary key (Ethereum address, lowercase)
 */
export const profiles = sqliteTable("profiles", {
  address: text("address").primaryKey(),
  displayName: text("display_name"),
  bio: text("bio"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

/**
 * Follow relationships between users
 * - Unique constraint prevents duplicate follows
 */
export const follows = sqliteTable(
  "follows",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    followerAddress: text("follower_address").notNull(),
    followingAddress: text("following_address").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => ({
    uniqueFollow: unique().on(table.followerAddress, table.followingAddress),
  })
);

/**
 * Comments on prediction markets
 * - Each comment is tied to a market and author
 */
export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  marketId: text("market_id").notNull(),
  authorAddress: text("author_address").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

/**
 * User predictions (rationale for their positions)
 * - Each prediction explains why a user took YES or NO
 */
export const predictions = sqliteTable("predictions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  marketId: text("market_id").notNull(),
  authorAddress: text("author_address").notNull(),
  explanation: text("explanation").notNull(),
  isYes: integer("is_yes", { mode: "boolean" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
