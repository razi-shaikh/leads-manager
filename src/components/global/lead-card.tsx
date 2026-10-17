"use client";

/* eslint-disable @next/next/no-img-element -- remote user photos (CSV URLs, Frappe); plain img avoids remote-pattern churn. */
import { useState } from "react";
import { Heart, ImageOff } from "lucide-react";
import { toast } from "sonner";

import type { Lead, LeadEvent, LeadNote } from "@/db/schema";
import type { UpdateLeadInput } from "@/services/lead.service";
import type { LeadStatus } from "@/lib/lead-status";
import { formatLeadDate } from "@/lib/format";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { LeadDetail } from "./lead-detail";

// SOT:lead-card
// WHAT: Compact OLX-style card — image, price, year-km, name, location/date.
// WHY:  5 cards per row on laptop; click opens the full LeadDetail dialog.
// HOW:  Heart toggles favorite (persisted). Everything else lives in the dialog.
// WHERE: Grids on /leads and /pipeline via LeadGrid.

export type ActionResult = { ok: true } | { ok: false; error: string };

export type DetailsResult =
  | { ok: true; notes: LeadNote[]; events: LeadEvent[] }
  | { ok: false; error: string };

export type LeadCardHandlers = {
  onStatusChange: (leadId: string, status: LeadStatus) => Promise<ActionResult>;
  onAddNote: (leadId: string, text: string) => Promise<ActionResult>;
  onLoadDetails: (leadId: string) => Promise<DetailsResult>;
  onUpdate: (leadId: string, patch: UpdateLeadInput) => Promise<ActionResult>;
  onDelete: (leadId: string) => Promise<ActionResult>;
  onUploadPhotos: (leadId: string, formData: FormData) => Promise<{ ok: true; count: number } | { ok: false; error: string }>;
  onToggleFavorite: (leadId: string, value: boolean) => Promise<ActionResult>;
  onToggleFeatured: (leadId: string, value: boolean) => Promise<ActionResult>;
};

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("en-IN");

function yearKm(lead: Lead): string {
  const parts: string[] = [];
  if (lead.year != null) parts.push(String(lead.year));
  if (lead.kmDriven != null) parts.push(`${num.format(lead.kmDriven)} km`);
  return parts.length > 0 ? parts.join(" - ") : "—";
}

export function LeadCard({ lead, handlers }: { lead: Lead; handlers: LeadCardHandlers }) {
  const [open, setOpen] = useState(false);
  const [favorite, setFavorite] = useState(lead.isFavorite);
  const [toggling, setToggling] = useState(false);

  const photo = lead.photos[0];
  const title = lead.brandModel || "Unknown bike";

  async function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    if (toggling) return;
    const next = !favorite;
    setFavorite(next);
    setToggling(true);
    try {
      const result = await handlers.onToggleFavorite(lead.id, next);
      if (!result.ok) {
        setFavorite(!next);
        toast.error("Could not update favorite", { description: result.error });
      }
    } finally {
      setToggling(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  }

  return (
    <>
      <article
        onClick={() => setOpen(true)}
        onKeyDown={handleKey}
        tabIndex={0}
        role="button"
        aria-label={`${title}, ${lead.expectedPrice != null ? `₹${inr.format(lead.expectedPrice)}` : "no price"}`}
        className="relative cursor-pointer overflow-hidden rounded-md border bg-white transition-shadow hover:shadow-md"
      >
        {lead.isFeatured ? (
          <span className="absolute inset-y-0 left-0 z-10 w-1 bg-yellow-400" aria-hidden />
        ) : null}
        <div className="relative">
          {photo ? (
            <img src={photo} alt={title} loading="lazy" className="aspect-[4/3] w-full object-cover" />
          ) : (
            <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 bg-muted text-xs text-muted-foreground">
              <ImageOff className="size-5" aria-hidden />
              No photo
            </div>
          )}
          <button
            type="button"
            onClick={handleFavorite}
            aria-pressed={favorite}
            aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
            className="absolute top-2 right-2 z-10 flex size-8 items-center justify-center rounded-full bg-white shadow"
          >
            <Heart className={favorite ? "size-4 fill-red-500 text-red-500" : "size-4 text-gray-700"} aria-hidden />
          </button>
          {lead.isFeatured ? (
            <span className="absolute bottom-2 left-2 z-10 rounded-sm bg-yellow-400 px-1.5 py-0.5 text-[10px] font-bold text-black">
              FEATURED
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-0.5 p-2.5">
          <p className="text-lg leading-tight font-bold text-black">
            {lead.expectedPrice != null ? `₹${inr.format(lead.expectedPrice)}` : "—"}
          </p>
          <p className="text-[13px] leading-tight text-gray-700">{yearKm(lead)}</p>
          <p className="truncate text-[13px] leading-tight text-gray-500">{title}</p>
          <p className="mt-1.5 flex items-center justify-between gap-2 text-[11px] leading-tight text-gray-400">
            <span className="truncate uppercase">{lead.location || "—"}</span>
            <span className="shrink-0">{formatLeadDate(lead.leadDate ?? lead.createdAt)}</span>
          </p>
        </div>
      </article>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <LeadDetail lead={lead} handlers={handlers} />
        </DialogContent>
      </Dialog>
    </>
  );
}
