import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/lead-status";
import { StatusTag } from "./status-tag";

// SOT:stat-card
// WHAT: Dashboard count card — plain label+count, or status tag+count.
// WHY:  One card shape for totals and per-status counts.
// HOW:  Server-safe; pass either label or status.
// WHERE: /dashboard.

const num = new Intl.NumberFormat("en-IN");

export function StatCard(
  props: { count: number } & ({ label: string; status?: never } | { status: LeadStatus; label?: never }),
) {
  return (
    <Card>
      <CardHeader className="pb-2">
        {props.status ? (
          <StatusTag status={props.status} />
        ) : (
          <CardTitle className="text-base font-medium text-muted-foreground">{props.label}</CardTitle>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-semibold tabular-nums" aria-label={`${props.status ? LEAD_STATUS_LABELS[props.status] : props.label}: ${props.count}`}>
          {num.format(props.count)}
        </p>
      </CardContent>
    </Card>
  );
}
