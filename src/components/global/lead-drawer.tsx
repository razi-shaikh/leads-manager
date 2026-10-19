"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import type { Lead, LeadEvent, LeadNote } from "@/db/schema";
import type { UpdateLeadInput } from "@/services/lead.service";
import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/lead-status";
import { formatDateTime } from "@/lib/format";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { DeleteButton } from "./delete-button";
import { QuickNoteSuggestions } from "./quick-note-suggestions";
import type { LeadCardHandlers } from "./lead-card";
import { PhotoCarousel } from "./photo-carousel";
import { PhotoDialog, type UploadResult } from "./photo-dialog";
import { PhotoViewer } from "./photo-viewer";
import { PrioritySelect } from "./priority-select";
import { StatusDropdown } from "./status-dropdown";

// SOT:lead-drawer
// WHAT: Right-side drawer — photos, status, priority, editable fields, notes, history.
// WHY:  One surface for the whole workflow; closing with unsaved edits confirms first.
// HOW:  Mounted fresh on every open (LeadCard keys it); owns the Sheet so close
//       attempts (X, overlay, Escape) can be intercepted for the save prompt.
//       Notes + events load once, then reload after every mutation.
// WHERE: Opened from LeadCard on /leads and /pipeline.

function toNumberOrNull(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? Math.round(value) : null;
}

function initialForm(lead: Lead) {
  return {
    source: lead.source,
    customerName: lead.customerName,
    phone: lead.phone,
    email: lead.email,
    brandModel: lead.brandModel,
    regNo: lead.regNo,
    year: lead.year == null ? "" : String(lead.year),
    kmDriven: lead.kmDriven == null ? "" : String(lead.kmDriven),
    owners: lead.owners == null ? "" : String(lead.owners),
    location: lead.location,
    expectedPrice: lead.expectedPrice == null ? "" : String(lead.expectedPrice),
    ourPrice: lead.ourPrice == null ? "" : String(lead.ourPrice),
  };
}

type Details = { notes: LeadNote[]; events: LeadEvent[] };

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

export function LeadDrawer({
  lead,
  handlers,
  open,
  onOpenChange,
}: {
  lead: Lead;
  handlers: LeadCardHandlers;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const title = lead.brandModel || "Unknown bike";
  const [details, setDetails] = useState<Details | null>(null);
  const [form, setForm] = useState(() => initialForm(lead));
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const pristine = useMemo(() => initialForm(lead), [lead]);
  const isDirty = JSON.stringify(form) !== JSON.stringify(pristine) || draft.trim() !== "";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await handlers.onLoadDetails(lead.id);
      if (cancelled) return;
      if (result.ok) {
        setDetails({ notes: result.notes, events: result.events });
      } else {
        toast.error("Could not load notes and history", { description: result.error });
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [handlers, lead.id]);

  async function reload() {
    const result = await handlers.onLoadDetails(lead.id);
    if (result.ok) setDetails({ notes: result.notes, events: result.events });
  }

  async function handleStatusChange(id: string, status: LeadStatus) {
    const result = await handlers.onStatusChange(id, status);
    if (result.ok) void reload();
    return result;
  }

  async function handleUploadPhotos(id: string, formData: FormData): Promise<UploadResult> {
    const result = await handlers.onUploadPhotos(id, formData);
    if (result.ok) void reload();
    return result;
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function doSave(): Promise<boolean> {
    if (saving) return false;
    setSaving(true);
    try {
      const patch: UpdateLeadInput = {
        source: form.source.trim(),
        customerName: form.customerName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        brandModel: form.brandModel.trim(),
        regNo: form.regNo.trim(),
        year: toNumberOrNull(form.year),
        kmDriven: toNumberOrNull(form.kmDriven),
        owners: toNumberOrNull(form.owners),
        location: form.location.trim(),
        expectedPrice: toNumberOrNull(form.expectedPrice),
        ourPrice: toNumberOrNull(form.ourPrice),
      };
      const result = await handlers.onUpdate(lead.id, patch);
      if (!result.ok) {
        toast.error("Could not save changes", { description: result.error });
        return false;
      }
      toast.success("Lead updated");
      void reload();
      return true;
    } finally {
      setSaving(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await doSave();
  }

  async function handleSaveAndClose() {
    const ok = await doSave();
    if (ok) {
      setConfirming(false);
      onOpenChange(false);
    }
  }

  function handleDiscard() {
    setConfirming(false);
    onOpenChange(false);
  }

  function handleSheetOpenChange(next: boolean) {
    if (!next) {
      if (viewerIndex !== null) {
        setViewerIndex(null);
        return;
      }
      if (isDirty) {
        setConfirming(true);
        return;
      }
    }
    onOpenChange(next);
  }

  async function handleAddNote() {
    const text = draft.trim();
    if (!text || noteSaving) return;
    setNoteSaving(true);
    try {
      const result = await handlers.onAddNote(lead.id, text);
      if (!result.ok) {
        toast.error("Could not save note", { description: result.error });
        return;
      }
      setDraft("");
      await reload();
      toast.success("Note added");
    } finally {
      setNoteSaving(false);
    }
  }

  function field(label: string, key: keyof typeof form, type = "text") {
    return (
      <div className="flex flex-col gap-1.5" key={key}>
        <Label htmlFor={`drawer-${key}`} className="text-[15px]">
          {label}
        </Label>
        <Input
          id={`drawer-${key}`}
          type={type}
          inputMode={type === "number" ? "numeric" : undefined}
          value={form[key]}
          onChange={(e) => set(key, e.target.value)}
          className="text-[15px] md:text-[15px]"
        />
      </div>
    );
  }

  const subtitle = [
    lead.regNo || "No reg. no.",
    lead.year ? String(lead.year) : null,
    lead.source ? `via ${lead.source}` : null,
  ]
    .filter((part): part is string => part !== null)
    .join(" · ");

  return (
    <>
      <Sheet open={open} onOpenChange={handleSheetOpenChange}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader className="pr-10 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <SheetTitle className="text-xl">{title}</SheetTitle>
              {lead.isDuplicate ? <Badge variant="outline">Duplicate</Badge> : null}
            </div>
            <SheetDescription className="text-[15px]">{subtitle}</SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-6 px-4 pb-6">
            <section className="flex flex-col gap-2">
              <div className="overflow-hidden rounded-md border">
                <PhotoCarousel photos={lead.photos} alt={title} onPhotoClick={setViewerIndex} />
              </div>
              <div>
                <PhotoDialog
                  leadId={lead.id}
                  leadTitle={title}
                  onUploadPhotos={handleUploadPhotos}
                />
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-[15px] font-medium text-muted-foreground">Status</span>
                <StatusDropdown
                  leadId={lead.id}
                  value={lead.status}
                  onStatusChange={handleStatusChange}
                  onAddNote={handlers.onAddNote}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[15px] font-medium text-muted-foreground">Priority</span>
                <PrioritySelect
                  leadId={lead.id}
                  value={lead.priority}
                  onSetPriority={handlers.onSetPriority}
                />
              </div>
            </section>

            <Separator />

            <section className="flex flex-col gap-3">
              <h3 className="text-base font-semibold">Details</h3>
              <form onSubmit={handleSave} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {field("Customer name", "customerName")}
                {field("Phone", "phone")}
                {field("Email", "email")}
                {field("Lead source", "source")}
                {field("Brand & model", "brandModel")}
                {field("Registration no.", "regNo")}
                {field("Year", "year", "number")}
                {field("KM driven", "kmDriven", "number")}
                {field("No. of owners", "owners", "number")}
                {field("Expected price (₹)", "expectedPrice", "number")}
                {field("Our price (₹)", "ourPrice", "number")}
                <div className="sm:col-span-2">{field("Location", "location")}</div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </form>
            </section>

            <Separator />

            <section className="flex flex-col gap-3">
              <h3 className="text-base font-semibold">Notes</h3>
              {details === null ? (
                <p className="text-[15px] text-muted-foreground">Loading…</p>
              ) : details.notes.length === 0 ? (
                <p className="text-[15px] text-muted-foreground">No notes yet. Add the first one below.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {details.notes.map((note) => (
                    <li key={note.id} className="rounded-md border p-3">
                      <p className="text-[15px] whitespace-pre-wrap">{note.text}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{formatDateTime(note.createdAt)}</p>
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
                className="text-[15px] md:text-[15px]"
              />
              <QuickNoteSuggestions draft={draft} onPick={setDraft} />
              <div>
                <Button size="sm" onClick={handleAddNote} disabled={noteSaving || !draft.trim()}>
                  <Plus data-icon="inline-start" />
                  {noteSaving ? "Saving…" : "Add note"}
                </Button>
              </div>
            </section>

            <Separator />

            <section className="flex flex-col gap-3">
              <h3 className="text-base font-semibold">History</h3>
              {details === null ? (
                <p className="text-[15px] text-muted-foreground">Loading…</p>
              ) : details.events.length === 0 ? (
                <p className="text-[15px] text-muted-foreground">No history yet.</p>
              ) : (
                <ol className="flex flex-col gap-3">
                  {details.events.map((event) => (
                    <li key={event.id} className="flex gap-3">
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden />
                      <div className="flex flex-col">
                        <span className="text-[15px]">{describe(event)}</span>
                        <span className="text-sm text-muted-foreground">{formatDateTime(event.createdAt)}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <Separator />

            <section>
              <DeleteButton
                leadId={lead.id}
                leadTitle={title}
                onDelete={handlers.onDelete}
                onDeleted={() => onOpenChange(false)}
              />
            </section>
          </div>
        </SheetContent>
      </Sheet>

      {viewerIndex !== null && lead.photos.length > 0 ? (
        <PhotoViewer
          photos={lead.photos}
          alt={title}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      ) : null}

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You edited this lead but did not save. Save your changes before closing?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <Button type="button" variant="outline" onClick={handleDiscard}>
              Discard
            </Button>
            <Button type="button" onClick={handleSaveAndClose} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
