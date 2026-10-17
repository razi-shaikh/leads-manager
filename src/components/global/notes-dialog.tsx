"use client";

import { useState } from "react";
import { MessageSquare, Plus } from "lucide-react";
import { toast } from "sonner";

import type { LeadNote } from "@/db/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";
import type { DetailsResult } from "./lead-card";

// SOT:notes-dialog
// WHAT: Notes viewer + adder — plain text notes with timestamps (FR-N1).
// WHY:  Follow-up conversation log per lead.
// HOW:  Loads via onLoadDetails on open; adds via onAddNote, then reloads.
// WHERE: LeadCard action row.

export function NotesDialog({
  leadId,
  leadTitle,
  onLoadDetails,
  onAddNote,
}: {
  leadId: string;
  leadTitle: string;
  onLoadDetails: (leadId: string) => Promise<DetailsResult>;
  onAddNote: (leadId: string, text: string) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<LeadNote[] | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const result = await onLoadDetails(leadId);
    if (result.ok) {
      setNotes(result.notes);
    } else {
      toast.error("Could not load notes", { description: result.error });
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setNotes(null);
      void load();
    }
  }

  async function handleAdd() {
    const text = draft.trim();
    if (!text || saving) return;
    setSaving(true);
    try {
      const result = await onAddNote(leadId, text);
      if (!result.ok) {
        toast.error("Could not save note", { description: result.error });
        return;
      }
      setDraft("");
      await load();
      toast.success("Note added");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <MessageSquare data-icon="inline-start" />
        Notes
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notes</DialogTitle>
          <DialogDescription>{leadTitle}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {notes === null ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes yet. Add the first one below.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {notes.map((note) => (
                <li key={note.id} className="rounded-md border p-3">
                  <p className="text-sm whitespace-pre-wrap">{note.text}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(note.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a note…"
            aria-label="New note"
            rows={3}
          />
          <div>
            <Button size="sm" onClick={handleAdd} disabled={saving || !draft.trim()}>
              <Plus data-icon="inline-start" />
              {saving ? "Saving…" : "Add note"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
