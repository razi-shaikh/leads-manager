"use client";

import { Check, ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/lead-status";
import type { ActionResult } from "./lead-card";
import { StatusNoteDialog } from "./status-note-dialog";
import { useStatusChange } from "./use-status-change";

// SOT:status-menu
// WHAT: Status badge on the card that changes status inline (FR-C3).
// WHY:  Compact OLX cards have no room for a select; a badge + menu fits.
// HOW:  Solid status-colored badge trigger; menu lists all six statuses.
//       Note-gated moves go through useStatusChange + StatusNoteDialog; clicks
//       never bubble to the card (no drawer open).
// WHERE: Top-left of the LeadCard photo.

const SOLID: Record<LeadStatus, string> = {
  new_lead: "bg-status-new",
  qualified: "bg-status-qualified",
  follow_up: "bg-status-followup",
  negotiation: "bg-status-negotiation",
  closed_won: "bg-status-won",
  closed_lost: "bg-status-lost",
};

export function StatusMenu({
  leadId,
  value,
  onStatusChange,
  onAddNote,
}: {
  leadId: string;
  value: LeadStatus;
  onStatusChange: (leadId: string, status: LeadStatus) => Promise<ActionResult>;
  onAddNote: (leadId: string, text: string) => Promise<ActionResult>;
}) {
  const { current, busy, awaiting, savingNote, requestChange, submitNote, cancelNote } =
    useStatusChange({ leadId, value, onStatusChange, onAddNote });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Status: ${LEAD_STATUS_LABELS[current]}. Change lead status.`}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className={`inline-flex h-5 cursor-pointer items-center gap-0.5 rounded-full px-2 text-xs font-semibold text-white shadow ${SOLID[current]}`}
        >
          {LEAD_STATUS_LABELS[current]}
          <ChevronDown className="size-3" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuGroup>
            {LEAD_STATUSES.map((status) => (
              <DropdownMenuItem key={status} disabled={busy} onClick={() => requestChange(status)}>
                <span className={`size-2 rounded-full ${SOLID[status]}`} aria-hidden />
                {LEAD_STATUS_LABELS[status]}
                {status === current ? <Check className="ml-auto size-3.5" aria-hidden /> : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {awaiting ? (
        <StatusNoteDialog
          key={`${leadId}-${awaiting.status}`}
          status={awaiting.status}
          requirement={awaiting.requirement}
          saving={savingNote}
          onSubmit={submitNote}
          onCancel={cancelNote}
        />
      ) : null}
    </>
  );
}
