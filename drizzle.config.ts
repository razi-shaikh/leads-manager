import { defineConfig } from "drizzle-kit";

// SOT:db-config
// WHAT: Drizzle Kit config — schema location and migration output.
// HOW: Run with DATABASE_URL in the environment, e.g. loaded from .env.local.

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
});
