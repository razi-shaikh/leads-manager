import { Badge } from "@/components/ui/badge";
import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/lead-status";

// SOT:status-tag
// WHAT: Color-coded status tag (+ optional duplicate outline tag).
// WHY:  Every card and list shows status identically from one component.
// HOW:  Maps LeadStatus to extended Badge variants (see badgeVariants + globals.css).
// WHERE: LeadCard and anywhere a lead status is displayed.

const VARIANTS = {
  new_lead: "statusNew",
  qualified: "statusQualified",
  follow_up: "statusFollowup",
  negotiation: "statusNegotiation",
  closed_won: "statusWon",
  closed_lost: "statusLost",
} as const;

export function StatusTag({ status, duplicate }: { status: LeadStatus; duplicate?: boolean }) {
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <Badge variant={VARIANTS[status]}>{LEAD_STATUS_LABELS[status]}</Badge>
      {duplicate ? <Badge variant="outline">Duplicate</Badge> : null}
    </span>
  );
}
