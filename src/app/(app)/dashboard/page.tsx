import { requireSession } from "@/lib/auth";
import { getDashboardCounts } from "@/services/stats.service";
import { KNOWN_SOURCES, LEAD_STATUSES } from "@/lib/lead-status";
import { StatCard } from "@/components/global/stat-card";
import { SourceFilter } from "./source-filter";

// SOT:dashboard-page
// WHAT: /dashboard — per-status counts, new-today count, source filter.
// WHY:  Morning triage overview (PRD FR-D1–D3).
// HOW:  Server component; ?source= param scopes counts; SourceFilter navigates.
// WHERE: /dashboard (default landing after login).

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  await requireSession();
  const { source } = await searchParams;
  const activeSource = source && source !== "all" ? source : undefined;
  const counts = await getDashboardCounts(activeSource);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <SourceFilter sources={[...KNOWN_SOURCES]} active={source ?? "all"} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total leads" count={counts.total} />
        <StatCard label="Added today" count={counts.newToday} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">By status</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          {LEAD_STATUSES.map((status) => (
            <StatCard key={status} status={status} count={counts.byStatus[status]} />
          ))}
        </div>
      </div>
    </div>
  );
}
