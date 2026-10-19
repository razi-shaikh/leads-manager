import "server-only";

import { and, count, eq, gte, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { leadEvents, leads } from "@/db/schema";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/lead-status";
import { formatPeriodLabel, getPeriodStarts, type ActivityPeriod } from "@/lib/periods";

// SOT:stats-service
// WHAT: Dashboard aggregates — per-status counts, added periods, transition
//       periods (today / this week / this month, IST), source scope.
// WHY:  Dashboard reads aggregates, never full lead lists.
// HOW:  Called from the dashboard page (which enforces auth).
// WHERE: /src/app/(app)/dashboard/page.tsx.

export type DashboardCounts = {
  byStatus: Record<LeadStatus, number>;
  total: number;
  newToday: number;
};

export type StatusBreakdown = {
  status: LeadStatus;
  count: number;
};

export type ActivityByDate = {
  period: ActivityPeriod;
  /** "19 Oct 2026" / "12 – 18 Oct 2026" / "Oct 2026". */
  label: string;
  addedTotal: number;
  /** Leads added in the period, by current status. */
  addedByStatus: StatusBreakdown[];
  /** Moves into each status during the period. */
  transitionsIn: StatusBreakdown[];
};

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
    ? and(scope, gte(leads.createdAt, getPeriodStarts().day))
    : gte(leads.createdAt, getPeriodStarts().day);
  const [todayRow] = await db.select({ value: count() }).from(leads).where(todayWhere);

  return { byStatus, total, newToday: todayRow?.value ?? 0 };
}

export async function getActivityByDate(
  period: ActivityPeriod,
  source?: string,
): Promise<ActivityByDate> {
  const starts = getPeriodStarts();
  const start = period === "today" ? starts.day : period === "week" ? starts.week : starts.month;
  const scope = source ? eq(leads.source, source) : undefined;

  const addedWhere = scope ? and(scope, gte(leads.createdAt, start)) : gte(leads.createdAt, start);
  const addedRows = await db
    .select({
      status: leads.status,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(leads)
    .where(addedWhere)
    .groupBy(leads.status);
  const addedByStatus = LEAD_STATUSES.map((status) => ({
    status,
    count: addedRows.find((row) => row.status === status)?.count ?? 0,
  }));
  const addedTotal = addedByStatus.reduce((sum, row) => sum + row.count, 0);

  const eventWhere = scope
    ? and(eq(leadEvents.type, "status_change"), gte(leadEvents.createdAt, start), scope)
    : and(eq(leadEvents.type, "status_change"), gte(leadEvents.createdAt, start));
  const eventRows = await db
    .select({
      to: leadEvents.toStatus,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(leadEvents)
    .innerJoin(leads, eq(leadEvents.leadId, leads.id))
    .where(eventWhere)
    .groupBy(leadEvents.toStatus);
  const transitionsIn = LEAD_STATUSES.map((status) => ({
    status,
    count: eventRows.find((row) => row.to === status)?.count ?? 0,
  }));

  return {
    period,
    label: formatPeriodLabel(period, starts),
    addedTotal,
    addedByStatus,
    transitionsIn,
  };
}
