"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import type { Lead } from "@/db/schema";
import type { UpdateLeadInput } from "@/services/lead.service";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// SOT:edit-dialog
// WHAT: Edit form — every lead field editable (FR-C4).
// WHY:  Details change after import; user corrects them in place.
// HOW:  Local state per field; numbers coerce (blank → null); submit → onUpdate.
// WHERE: LeadCard action row.

function toNumberOrNull(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? Math.round(value) : null;
}

export function EditDialog({
  lead,
  onUpdate,
}: {
  lead: Lead;
  onUpdate: (leadId: string, patch: UpdateLeadInput) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
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
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
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
      };
      const result = await onUpdate(lead.id, patch);
      if (!result.ok) {
        toast.error("Could not save changes", { description: result.error });
        return;
      }
      toast.success("Lead updated");
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  function field(label: string, key: keyof typeof form, type = "text") {
    return (
      <div className="flex flex-col gap-1.5" key={key}>
        <Label htmlFor={`edit-${key}`}>{label}</Label>
        <Input
          id={`edit-${key}`}
          type={type}
          inputMode={type === "number" ? "numeric" : undefined}
          value={form[key]}
          onChange={(e) => set(key, e.target.value)}
        />
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Pencil data-icon="inline-start" />
        Edit
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit lead</DialogTitle>
          <DialogDescription>{lead.brandModel || "Unknown bike"}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          <div className="sm:col-span-2">{field("Location", "location")}</div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
