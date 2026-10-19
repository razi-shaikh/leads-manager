"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/lead-status";
import type { ActionResult } from "./lead-card";
import { StatusNoteDialog } from "./status-note-dialog";
import { useStatusChange } from "./use-status-change";

// SOT:status-dropdown
// WHAT: Status changer — shadcn Select with all six statuses.
// WHY:  Note-gated moves (useStatusChange) must explain themselves in history.
// HOW:  Selection runs through the shared flow; required notes save first.
// WHERE: LeadDrawer status section on All Leads and Pipeline.

export function StatusDropdown({
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
      <Select value={current} onValueChange={requestChange} disabled={busy}>
        <SelectTrigger aria-label="Change lead status" className="w-full text-[15px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {LEAD_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {LEAD_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

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
