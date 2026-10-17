import type { Lead } from "@/db/schema";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { LeadCard, type LeadCardHandlers } from "./lead-card";

// SOT:lead-grid
// WHAT: Responsive card grid + shared empty state.
// WHY:  All Leads and Pipeline render cards identically.
// HOW:  Server-safe; handlers pass through to each LeadCard.
// WHERE: /leads and /pipeline pages.

export function LeadGrid({
  leads,
  handlers,
  emptyTitle,
  emptyDescription,
}: {
  leads: Lead[];
  handlers: LeadCardHandlers;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (leads.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {leads.map((lead) => (
        <LeadCard key={lead.id} lead={lead} handlers={handlers} />
      ))}
    </div>
  );
}
