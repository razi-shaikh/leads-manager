import { CalendarDays, History } from "lucide-react";

import { requireSession } from "@/lib/auth";
import { getActivityByDate, getDashboardCounts } from "@/services/stats.service";
import { KNOWN_SOURCES, LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/lead-status";
import type { ActivityPeriod } from "@/lib/periods";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/global/stat-card";
import { PeriodTabs } from "./period-tabs";
import { SourceFilter } from "./source-filter";

// SOT:dashboard-page
// WHAT: /dashboard — Lead Activity by Date (period tabs + imported panel +
//       transition totals), then all-time Total and By-status.
// WHY:  One manual period switch (Today / This Week / This Month) scopes every
//       activity number; source filter scopes those too.
// HOW:  Server component; ?period= + ?source= params drive getActivityByDate.
// WHERE: /dashboard (default landing after login).

export const instant = false;

const PERIODS: ActivityPeriod[] = ["today", "week", "month"];

const TRANSITION_NUMBER: Record<LeadStatus, string> = {
  new_lead: "text-status-new",
  qualified: "text-status-qualified",
  follow_up: "text-status-followup",
  negotiation: "text-status-negotiation",
  closed_won: "text-status-won",
  closed_lost: "text-status-lost",
};

const CHIP_VARIANTS = {
  new_lead: "statusNew",
  qualified: "statusQualified",
  follow_up: "statusFollowup",
  negotiation: "statusNegotiation",
  closed_won: "statusWon",
  closed_lost: "statusLost",
} as const;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; period?: string }>;
}) {
  await requireSession();
  const { source, period: periodParam } = await searchParams;
  const activeSource = source && source !== "all" ? source : undefined;
  const period: ActivityPeriod = PERIODS.includes(periodParam as ActivityPeriod)
    ? (periodParam as ActivityPeriod)
    : "month";
  const counts = await getDashboardCounts(activeSource);
  const activity = await getActivityByDate(period, activeSource);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <SourceFilter sources={[...KNOWN_SOURCES]} active={source ?? "all"} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <CalendarDays className="size-5" aria-hidden />
          Lead Activity by Date
        </h2>
        <PeriodTabs active={period} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <p className="text-[15px] text-muted-foreground">{activity.label}</p>
            <p className="text-6xl font-bold tabular-nums">{activity.addedTotal.toLocaleString("en-IN")}</p>
            <p className="text-[15px] text-muted-foreground">leads added</p>
            <div className="flex flex-wrap gap-2">
              {activity.addedByStatus.map(({ status, count }) => (
                <Badge key={status} variant={CHIP_VARIANTS[status]} className="text-[13px]">
                  {LEAD_STATUS_LABELS[status]}: {count.toLocaleString("en-IN")}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="size-5" aria-hidden />
              Stage Transition Totals
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Moves into each status in the selected period.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col">
            {activity.transitionsIn.map(({ status, count }) => (
              <div
                key={status}
                className="flex items-center justify-between gap-2 border-b py-2.5 last:border-0"
              >
                <span className="flex items-center gap-2 text-[15px]">
                  <History className="size-4 text-muted-foreground" aria-hidden />
                  {LEAD_STATUS_LABELS[status]}
                </span>
                <span className={`text-xl font-bold tabular-nums ${TRANSITION_NUMBER[status]}`}>
                  {count.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-xl font-medium">Total & by status (all time)</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Total leads" count={counts.total} />
          {LEAD_STATUSES.map((status) => (
            <StatCard key={status} status={status} count={counts.byStatus[status]} />
          ))}
        </div>
      </div>
    </div>
  );
}
