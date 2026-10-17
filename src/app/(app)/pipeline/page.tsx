import { requireSession } from "@/lib/auth";
import { listLeads } from "@/services/lead.service";
import {
  DEFAULT_PIPELINE_STATUS,
  KNOWN_SOURCES,
  LEADS_PER_PAGE,
  PIPELINE_STATUSES,
  leadStatusSchema,
} from "@/lib/lead-status";
import { LeadGrid } from "@/components/global/lead-grid";
import { ListPagination } from "@/components/global/list-pagination";
import { SearchBar } from "@/components/global/search-bar";
import { SourceSelect } from "@/components/global/source-select";
import {
  addNoteAction,
  deleteLeadAction,
  loadDetailsAction,
  toggleFavoriteAction,
  toggleFeaturedAction,
  updateLeadAction,
  updateStatusAction,
  uploadPhotosAction,
} from "../leads/actions";
import { PipelineTabs } from "./pipeline-tabs";

// SOT:pipeline-page
// WHAT: Pipeline — status tabs (no New Lead) + search + source filter + grid.
// WHY:  Work qualified→closed leads by stage (PRD FR-P1–P3); Qualified default.
// HOW:  ?tab= selects the stage; same card grid and handlers as All Leads.
// WHERE: /pipeline.

type Params = { tab?: string; q?: string; source?: string; page?: string };

export default async function PipelinePage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireSession();
  const params = await searchParams;

  const tab = leadStatusSchema.safeParse(params.tab);
  const activeTab =
    tab.success && (PIPELINE_STATUSES as string[]).includes(tab.data)
      ? tab.data
      : DEFAULT_PIPELINE_STATUS;
  const page = Math.max(1, Number(params.page) || 1);
  const { items, total, totalPages } = await listLeads({
    search: params.q || undefined,
    status: activeTab,
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
        <h1 className="text-2xl font-semibold">Pipeline</h1>
        <p className="text-sm text-muted-foreground">
          {`${total} lead${total === 1 ? "" : "s"}`}
        </p>
      </div>
      <PipelineTabs active={activeTab} />
      <div className="flex flex-wrap items-center gap-2">
        <SearchBar placeholder="Search name, phone, reg. no…" />
        <SourceSelect sources={[...KNOWN_SOURCES]} />
      </div>
      <LeadGrid
        leads={items}
        handlers={handlers}
        emptyTitle="No leads in this stage"
        emptyDescription="Move leads here from their status dropdown, or pick another stage."
      />
      <div className="flex justify-center pt-2">
        <ListPagination page={page} totalPages={totalPages} />
      </div>
    </div>
  );
}
