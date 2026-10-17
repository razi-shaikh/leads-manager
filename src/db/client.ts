import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { env } from "@/lib/env";
import * as schema from "./schema";

// SOT:db-client
// WHAT: Single Drizzle client (Neon HTTP driver) for serverless + local use.
// WHY:  One connection point; importable ONLY from src/services/* (ESLint).
// HOW:  Pooled DATABASE_URL; stateless HTTP driver — no pool management needed.
// WHERE: Consumed exclusively by the service layer.

const sql = neon(env.DATABASE_URL);

export const db = drizzle(sql, { schema });

export type Database = typeof db;
