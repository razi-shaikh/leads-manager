import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

config({ path: ".env.local" });

// SOT:db-migrate
// WHAT: Applies committed ./drizzle migrations via the Neon HTTP driver.
// WHY:  drizzle-kit's websocket migrate path is unreliable here; HTTP just works.
// HOW:  npm run db:migrate (local .env.local) or with DATABASE_URL set (prod).

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const db = drizzle(neon(url));
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations applied.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
