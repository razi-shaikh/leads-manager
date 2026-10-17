"use client";

import { useState } from "react";
import { History } from "lucide-react";
import { toast } from "sonner";

import type { LeadEvent } from "@/db/schema";
import { LEAD_STATUS_LABELS } from "@/lib/lead-status";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/format";
import type { DetailsResult } from "./lead-card";

// SOT:history-dialog
// WHAT: History timeline — status changes, notes, edits, imports, photos (FR-N2).
// WHY:  Full audit trail per lead in chronological order.
// HOW:  Loads events via onLoadDetails on open; renders newest first.
// WHERE: LeadCard action row.

function describe(event: LeadEvent): string {
  switch (event.type) {
    case "import":
      return event.detail || "Imported";
    case "status_change":
      return `Status: ${event.fromStatus ? LEAD_STATUS_LABELS[event.fromStatus] : "—"} → ${event.toStatus ? LEAD_STATUS_LABELS[event.toStatus] : "—"}`;
    case "note":
      return `Note: ${event.detail || ""}`;
    case "edit":
      return event.detail || "Edited";
    case "photo":
      return event.detail || "Photos added";
  }
}

export function HistoryDialog({
  leadId,
  leadTitle,
  onLoadDetails,
}: {
  leadId: string;
  leadTitle: string;
  onLoadDetails: (leadId: string) => Promise<DetailsResult>;
}) {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<LeadEvent[] | null>(null);

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;
    setEvents(null);
    const result = await onLoadDetails(leadId);
    if (result.ok) {
      setEvents(result.events);
    } else {
      toast.error("Could not load history", { description: result.error });
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <History data-icon="inline-start" />
        History
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>History</DialogTitle>
          <DialogDescription>{leadTitle}</DialogDescription>
        </DialogHeader>
        {events === null ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No history yet.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {events.map((event) => (
              <li key={event.id} className="flex gap-3">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden />
                <div className="flex flex-col">
                  <span className="text-sm">{describe(event)}</span>
                  <span className="text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}
