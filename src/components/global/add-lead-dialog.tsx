"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import type { ManualCreateInput } from "@/services/lead.service";
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

// SOT:add-lead-dialog
// WHAT: Manual lead creation — every field, source required, rest optional.
// WHY:  Quick entry for walk-in/phone leads without a CSV (journey J1).
// HOW:  Local form state; submit → onCreate → toast + close + reset.
// WHERE: All Leads page header.

const EMPTY = {
  source: "",
  customerName: "",
  phone: "",
  email: "",
  brandModel: "",
  regNo: "",
  year: "",
  kmDriven: "",
  owners: "",
  location: "",
  expectedPrice: "",
  ourPrice: "",
};

function toNumberOrNull(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? Math.round(value) : null;
}

export function AddLeadDialog({
  onCreate,
}: {
  onCreate: (input: ManualCreateInput) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setForm({ ...EMPTY });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !form.source.trim()) return;
    setSaving(true);
    try {
      const input: ManualCreateInput = {
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
      const result = await onCreate(input);
      if (!result.ok) {
        toast.error("Could not add lead", { description: result.error });
        return;
      }
      toast.success("Lead added");
      setOpen(false);
      setForm({ ...EMPTY });
    } finally {
      setSaving(false);
    }
  }

  function field(label: string, key: keyof typeof form, type = "text", required = false) {
    return (
      <div className="flex flex-col gap-1.5" key={key}>
        <Label htmlFor={`add-${key}`} className="text-[15px]">
          {label}
          {required ? " *" : ""}
        </Label>
        <Input
          id={`add-${key}`}
          type={type}
          inputMode={type === "number" ? "numeric" : undefined}
          value={form[key]}
          onChange={(e) => set(key, e.target.value)}
          required={required}
          className="text-[15px] md:text-[15px]"
        />
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus data-icon="inline-start" />
        Add lead
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add lead</DialogTitle>
          <DialogDescription>Only the lead source is required — fill the rest as needed.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {field("Lead source", "source", "text", true)}
          {field("Customer name", "customerName")}
          {field("Phone", "phone")}
          {field("Email", "email")}
          {field("Brand & model", "brandModel")}
          {field("Registration no.", "regNo")}
          {field("Year", "year", "number")}
          {field("KM driven", "kmDriven", "number")}
          {field("No. of owners", "owners", "number")}
          {field("Expected price (₹)", "expectedPrice", "number")}
          {field("Our price (₹)", "ourPrice", "number")}
          <div className="sm:col-span-2">{field("Location", "location")}</div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving || !form.source.trim()}>
              {saving ? "Adding…" : "Add lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
