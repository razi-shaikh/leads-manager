"use client";

import { useState } from "react";

import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/lead-status";
import type { StatusNoteRequirement } from "@/lib/lead-status";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QuickNoteSuggestions } from "./quick-note-suggestions";

// SOT:status-note-dialog
// WHAT: Required-note prompt for note-gated status moves.
// WHY:  Follow-up / Negotiation / Won / Lost moves must record why.
// HOW:  Mounted fresh per request (parent keys it); submit disabled until the
//       note is non-empty; Escape/outside-click cancels without changing status.
// WHERE: Rendered by StatusMenu and StatusDropdown via useStatusChange.

export function StatusNoteDialog({
  status,
  requirement,
  saving,
  onSubmit,
  onCancel,
}: {
  status: LeadStatus;
  requirement: Extract<StatusNoteRequirement, { required: true }>;
  saving: boolean;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");

  return (
    <Dialog open onOpenChange={(next) => { if (!next) onCancel(); }}>
      {/* Stop clicks reaching the card article: this dialog renders inside the
          LeadCard tree (portal), and bubbled clicks would open the drawer. */}
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{requirement.title}</DialogTitle>
          <DialogDescription>
            Moving to {LEAD_STATUS_LABELS[status]} requires a note — it will be
            saved to the lead&apos;s history along with the status change.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status-note" className="text-[15px]">
            {requirement.label}
          </Label>
          <Textarea
            id="status-note"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write what happened…"
            rows={4}
            autoFocus
            className="text-[15px] md:text-[15px]"
          />
          <QuickNoteSuggestions draft={text} onPick={setText} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => onSubmit(text)} disabled={saving || !text.trim()}>
            {saving ? "Saving…" : "Save & update status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
