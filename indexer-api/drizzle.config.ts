import type { Config } from "drizzle-kit";

export default {
  schema: "./src/social/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "./social.db",
  },
} satisfies Config;
