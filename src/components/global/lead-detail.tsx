"use client";

import { useState } from "react";
import { Mail, MapPin, Phone, Star, User } from "lucide-react";
import { toast } from "sonner";

import type { Lead } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteButton } from "./delete-button";
import { EditDialog } from "./edit-dialog";
import { HistoryDialog } from "./history-dialog";
import type { LeadCardHandlers } from "./lead-card";
import { NotesDialog } from "./notes-dialog";
import { PhotoCarousel } from "./photo-carousel";
import { PhotoDialog } from "./photo-dialog";
import { StatusDropdown } from "./status-dropdown";
import { StatusTag } from "./status-tag";

// SOT:lead-detail
// WHAT: Full lead detail — carousel, all fields, contact, status + every action.
// WHY:  Compact OLX cards can't hold the workflow; click opens this instead.
// HOW:  Rendered inside the LeadCard dialog; same handlers as the grids.
// WHERE: LeadCard detail dialog on /leads and /pipeline.

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("en-IN");

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium break-words">{value}</span>
    </div>
  );
}

export function LeadDetail({ lead, handlers }: { lead: Lead; handlers: LeadCardHandlers }) {
  const title = lead.brandModel || "Unknown bike";
  const [featured, setFeatured] = useState(lead.isFeatured);
  const [toggling, setToggling] = useState(false);

  async function handleFeatured() {
    if (toggling) return;
    const next = !featured;
    setFeatured(next);
    setToggling(true);
    try {
      const result = await handlers.onToggleFeatured(lead.id, next);
      if (!result.ok) {
        setFeatured(!next);
        toast.error("Could not update featured flag", { description: result.error });
      }
    } finally {
      setToggling(false);
    }
  }

  return (
    <Card className="overflow-hidden border-0 pt-0 shadow-none">
      <PhotoCarousel photos={lead.photos} alt={title} />
      <CardHeader className="gap-2">
        <div className="flex items-center justify-between gap-2">
          <StatusTag status={lead.status} duplicate={lead.isDuplicate} />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFeatured}
            aria-pressed={featured}
            aria-label={featured ? "Remove featured flag" : "Mark as featured"}
          >
            <Star data-icon="inline-start" className={featured ? "fill-yellow-400 text-yellow-400" : undefined} />
            {featured ? "Featured" : "Feature"}
          </Button>
        </div>
        <CardTitle className="text-lg leading-snug">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {lead.regNo || "No reg. no."}
          {lead.year ? ` · ${lead.year}` : ""}
        </p>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <Detail label="Expected price" value={lead.expectedPrice != null ? `₹${inr.format(lead.expectedPrice)}` : "—"} />
        <Detail label="KM driven" value={lead.kmDriven != null ? `${num.format(lead.kmDriven)} km` : "—"} />
        <Detail label="Owners" value={lead.owners != null ? String(lead.owners) : "—"} />
        <Detail label="Location" value={lead.location || "—"} />
        <div className="col-span-2 flex flex-col gap-1 border-t pt-3 text-sm">
          <span className="flex items-center gap-2">
            <User className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            {lead.customerName || "—"}
          </span>
          <span className="flex items-center gap-2">
            <Phone className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            {lead.phone ? <a href={`tel:${lead.phone}`} className="underline-offset-4 hover:underline">{lead.phone}</a> : "—"}
          </span>
          {lead.email ? (
            <span className="flex items-center gap-2">
              <Mail className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              <a href={`mailto:${lead.email}`} className="truncate underline-offset-4 hover:underline">{lead.email}</a>
            </span>
          ) : null}
          {lead.source ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              via {lead.source}
            </span>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-2">
        <StatusDropdown leadId={lead.id} value={lead.status} onStatusChange={handlers.onStatusChange} />
        <div className="flex flex-wrap gap-2">
          <NotesDialog
            leadId={lead.id}
            leadTitle={title}
            onLoadDetails={handlers.onLoadDetails}
            onAddNote={handlers.onAddNote}
          />
          <HistoryDialog leadId={lead.id} leadTitle={title} onLoadDetails={handlers.onLoadDetails} />
          <EditDialog lead={lead} onUpdate={handlers.onUpdate} />
          <PhotoDialog leadId={lead.id} leadTitle={title} onUploadPhotos={handlers.onUploadPhotos} />
          <DeleteButton leadId={lead.id} leadTitle={title} onDelete={handlers.onDelete} />
        </div>
      </CardFooter>
    </Card>
  );
}
