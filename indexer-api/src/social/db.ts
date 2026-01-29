import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

/**
 * Social database connection
 *
 * Uses SQLite via better-sqlite3 for social features.
 * Separate from Ponder's internal database.
 */

// Create SQLite database connection
const sqlite = new Database("./social.db");

// Create Drizzle ORM instance with schema
export const socialDb = drizzle(sqlite, { schema });

// Export schema for use in queries
export { schema };
