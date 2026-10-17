import { config } from "dotenv";

config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "../src/db/schema";

// SOT:db-seed
// WHAT: Seeds 3 sample leads (one per source) for local development.
// WHY:  Uses the DB client directly (not services) because tsx cannot load the
//       `server-only` guard outside the Next.js server runtime.
// HOW:  npm run db:seed (uses .env.local). Safe to re-run; creates new rows.

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const db = drizzle(neon(url), { schema });

  const seeds: Array<typeof schema.leads.$inferInsert> = [
    {
      externalId: "SEED-001",
      source: "BikeBecho.com",
      customerName: "Arun Kumar",
      phone: "9876543210",
      email: "arun.kumar@example.com",
      brandModel: "Royal Enfield Classic 350",
      regNo: "KA-05-AB-1234",
      year: 2021,
      kmDriven: 18500,
      owners: 1,
      location: "Bengaluru",
      expectedPrice: 165000,
      photos: ["https://picsum.photos/seed/bike1a/800/600", "https://picsum.photos/seed/bike1b/800/600"],
      leadDate: new Date(),
      status: "new_lead",
      isDuplicate: false,
    },
    {
      externalId: "SEED-002",
      source: "Bike4Sale",
      customerName: "Priya Sharma",
      phone: "9812345678",
      email: "priya.sharma@example.com",
      brandModel: "Yamaha MT-15",
      regNo: "MH-12-CD-5678",
      year: 2022,
      kmDriven: 9200,
      owners: 1,
      location: "Pune",
      expectedPrice: 142000,
      photos: ["https://picsum.photos/seed/bike2a/800/600"],
      leadDate: new Date(),
      status: "qualified",
      isDuplicate: false,
    },
    {
      externalId: "SEED-003",
      source: "Facebook",
      customerName: "Rahul Verma",
      phone: "9765432109",
      email: "",
      brandModel: "KTM Duke 200",
      regNo: "DL-08-EF-9012",
      year: 2020,
      kmDriven: 24000,
      owners: 2,
      location: "Delhi",
      expectedPrice: 118000,
      photos: [],
      leadDate: new Date(),
      status: "follow_up",
      isDuplicate: true,
    },
  ];

  for (const seed of seeds) {
    const [lead] = await db.insert(schema.leads).values(seed).returning();
    if (!lead) throw new Error("Seed insert failed");
    await db.insert(schema.leadEvents).values({
      leadId: lead.id,
      type: "import",
      detail: `Seeded from ${seed.source}`,
    });
    console.log(`Seeded ${lead.brandModel} (${lead.id})`);
  }
  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
