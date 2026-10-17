import { requireSession } from "@/lib/auth";
import { listLeads } from "@/services/lead.service";
import { KNOWN_SOURCES, LEADS_PER_PAGE, leadStatusSchema } from "@/lib/lead-status";
import { LeadGrid } from "@/components/global/lead-grid";
import { ListPagination } from "@/components/global/list-pagination";
import { SearchBar } from "@/components/global/search-bar";
import { SourceSelect } from "@/components/global/source-select";
import { StatusSelect } from "@/components/global/status-select";
import {
  addNoteAction,
  deleteLeadAction,
  loadDetailsAction,
  toggleFavoriteAction,
  toggleFeaturedAction,
  updateLeadAction,
  updateStatusAction,
  uploadPhotosAction,
} from "./actions";

// SOT:all-leads-page
// WHAT: All Leads — search + status/source filters + card grid + pagination.
// WHY:  Full triage surface (PRD FR-L1–L5); filters live in URL params.
// HOW:  Server component; toolbar components push params; LeadGrid renders.
// WHERE: /leads.

type Params = { q?: string; status?: string; source?: string; page?: string };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireSession();
  const params = await searchParams;

  const status = leadStatusSchema.safeParse(params.status);
  const page = Math.max(1, Number(params.page) || 1);
  const { items, total, totalPages } = await listLeads({
    search: params.q || undefined,
    status: status.success ? status.data : undefined,
    source: params.source || undefined,
    page,
    perPage: LEADS_PER_PAGE,
  });

  const handlers = {
    onStatusChange: updateStatusAction,
    onAddNote: addNoteAction,
    onLoadDetails: loadDetailsAction,
    onUpdate: updateLeadAction,
    onDelete: deleteLeadAction,
    onUploadPhotos: uploadPhotosAction,
    onToggleFavorite: toggleFavoriteAction,
    onToggleFeatured: toggleFeaturedAction,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">All Leads</h1>
        <p className="text-sm text-muted-foreground">
          {`${total} lead${total === 1 ? "" : "s"}`}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SearchBar placeholder="Search name, phone, reg. no…" />
        <StatusSelect />
        <SourceSelect sources={[...KNOWN_SOURCES]} />
      </div>
      <LeadGrid
        leads={items}
        handlers={handlers}
        emptyTitle="No leads match"
        emptyDescription="Try a different search or filter — or import a CSV to add leads."
      />
      <div className="flex justify-center pt-2">
        <ListPagination page={page} totalPages={totalPages} />
      </div>
    </div>
  );
}
