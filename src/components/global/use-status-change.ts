"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  statusNoteRequirement,
  type LeadStatus,
  type StatusNoteRequirement,
} from "@/lib/lead-status";
import type { ActionResult } from "./lead-card";

// SOT:status-change-flow
// WHAT: Shared status-change flow — immediate moves apply at once, note-gated
//       moves (→ Follow-up, Follow-up → Negotiation, Negotiation → Closed Won,
//       anything → Closed Lost) open a required-note prompt first.
// WHY:  Card badge menu and drawer dropdown must enforce the same rules.
// HOW:  Consumers call requestChange; render StatusNoteDialog with `awaiting`;
//       submitNote saves the note first, then applies the status.
// WHERE: StatusMenu (card) and StatusDropdown (drawer).

type Awaiting = { status: LeadStatus; requirement: Extract<StatusNoteRequirement, { required: true }> };

export function useStatusChange({
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
  const [current, setCurrent] = useState<LeadStatus>(value);
  const [awaiting, setAwaiting] = useState<Awaiting | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [changing, startTransition] = useTransition();
  // Sync from the server when the lead changes underneath us (another tab or
  // a background refresh): render-phase adjustment, never an effect.
  const [lastValue, setLastValue] = useState<LeadStatus>(value);
  if (value !== lastValue) {
    setLastValue(value);
    setCurrent(value);
  }

  function applyChange(status: LeadStatus) {
    const previous = current;
    setCurrent(status);
    startTransition(async () => {
      const result = await onStatusChange(leadId, status);
      if (!result.ok) {
        setCurrent(previous);
        toast.error("Status change failed", { description: result.error });
      } else {
        toast.success(`Moved to ${LEAD_STATUS_LABELS[status]}`);
      }
    });
  }

  function requestChange(status: LeadStatus | null) {
    if (status === null || changing || savingNote) return;
    if (!LEAD_STATUSES.includes(status) || status === current) return;
    const requirement = statusNoteRequirement(current, status);
    if (requirement.required) {
      setAwaiting({ status, requirement });
      return;
    }
    applyChange(status);
  }

  async function submitNote(text: string) {
    const pending = awaiting;
    const trimmed = text.trim();
    if (!pending || !trimmed || savingNote) return;
    setSavingNote(true);
    try {
      const noteResult = await onAddNote(leadId, trimmed);
      if (!noteResult.ok) {
        toast.error("Could not save note", { description: noteResult.error });
        return;
      }
      setAwaiting(null);
      applyChange(pending.status);
    } finally {
      setSavingNote(false);
    }
  }

  return {
    current,
    busy: changing,
    awaiting,
    savingNote,
    requestChange,
    submitNote,
    cancelNote: () => setAwaiting(null),
  };
}
