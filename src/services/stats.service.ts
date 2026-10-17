import "server-only";

import { and, count, eq, gte } from "drizzle-orm";

import { db } from "@/db/client";
import { leads } from "@/db/schema";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/lead-status";

// SOT:stats-service
// WHAT: Dashboard aggregates — per-status counts, new-today count, source scope.
// WHY:  Dashboard reads aggregates, never full lead lists.
// HOW:  Called from the dashboard page (which enforces auth).
// WHERE: /src/app/(app)/dashboard/page.tsx.

export type DashboardCounts = {
  byStatus: Record<LeadStatus, number>;
  total: number;
  newToday: number;
};

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getDashboardCounts(source?: string): Promise<DashboardCounts> {
  const scope = source ? eq(leads.source, source) : undefined;

  const byStatus = {} as Record<LeadStatus, number>;
  let total = 0;
  for (const status of LEAD_STATUSES) {
    const where = scope ? and(scope, eq(leads.status, status)) : eq(leads.status, status);
    const [row] = await db.select({ value: count() }).from(leads).where(where);
    const value = row?.value ?? 0;
    byStatus[status] = value;
    total += value;
  }

  const todayWhere = scope
    ? and(scope, gte(leads.createdAt, startOfToday()))
    : gte(leads.createdAt, startOfToday());
  const [todayRow] = await db.select({ value: count() }).from(leads).where(todayWhere);

  return { byStatus, total, newToday: todayRow?.value ?? 0 };
}
