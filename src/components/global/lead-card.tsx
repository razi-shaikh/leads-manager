"use client";

/* eslint-disable @next/next/no-img-element -- remote user photos (CSV URLs, Frappe); plain img avoids remote-pattern churn. */
import { useState } from "react";
import { ImageOff } from "lucide-react";

import type { Lead, LeadEvent, LeadNote } from "@/db/schema";
import type { UpdateLeadInput } from "@/services/lead.service";
import type { LeadStatus } from "@/lib/lead-status";
import { LEAD_PRIORITY_ACCENTS, type LeadPriority } from "@/lib/lead-priority";
import { formatLeadDate, formatOwnerCount } from "@/lib/format";
import { LeadDrawer } from "./lead-drawer";
import { StatusMenu } from "./status-menu";

// SOT:lead-card
// WHAT: Compact OLX-style card — status badge, image, price, year-km-owner, name, source, phone/date.
// WHY:  5 cards per row on laptop; status changes inline, click opens the drawer.
// HOW:  Priority shows as a color-only accent bar. Duplicate shows a badge.
//       Phone links to WhatsApp; clicks never bubble to the card.
// WHERE: Grids on /leads and /pipeline via LeadGrid.

export type ActionResult = { ok: true } | { ok: false; error: string };

export type DetailsResult =
  | { ok: true; notes: LeadNote[]; events: LeadEvent[] }
  | { ok: false; error: string };

export type LeadCardHandlers = {
  onStatusChange: (leadId: string, status: LeadStatus) => Promise<ActionResult>;
  onAddNote: (leadId: string, text: string) => Promise<ActionResult>;
  onLoadDetails: (leadId: string) => Promise<DetailsResult>;
  onUpdate: (leadId: string, patch: UpdateLeadInput) => Promise<ActionResult>;
  onDelete: (leadId: string) => Promise<ActionResult>;
  onUploadPhotos: (leadId: string, formData: FormData) => Promise<{ ok: true; count: number } | { ok: false; error: string }>;
  onSetPriority: (leadId: string, priority: LeadPriority | null) => Promise<ActionResult>;
};

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("en-IN");

function yearKmOwners(lead: Lead): string {
  const parts: string[] = [];
  if (lead.year != null) parts.push(String(lead.year));
  if (lead.kmDriven != null) parts.push(`${num.format(lead.kmDriven)} km`);
  const owners = formatOwnerCount(lead.owners);
  if (owners) parts.push(owners);
  return parts.length > 0 ? parts.join(" - ") : "—";
}

/** wa.me link: digits only, 10-digit Indian numbers get the 91 prefix. */
function whatsAppLink(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) digits = `91${digits}`;
  return `https://wa.me/${digits}`;
}

export function LeadCard({ lead, handlers }: { lead: Lead; handlers: LeadCardHandlers }) {
  const [open, setOpen] = useState(false);

  const photo = lead.photos[0];
  const title = lead.brandModel || "Unknown bike";
  const waLink = whatsAppLink(lead.phone);

  function handleKey(e: React.KeyboardEvent) {
    // Only when the card itself is focused: keys bubbled from interactive
    // children (status badge, WhatsApp link) or the portalled note dialog
    // must not open the drawer — e.g. Space while typing a note.
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  }

  return (
    <>
      <article
        onClick={() => setOpen(true)}
        onKeyDown={handleKey}
        tabIndex={0}
        role="button"
        aria-label={`${title}, ${lead.expectedPrice != null ? `₹${inr.format(lead.expectedPrice)}` : "no price"}`}
        className="relative cursor-pointer overflow-hidden rounded-md border bg-white transition-shadow hover:shadow-md"
      >
        {lead.priority ? (
          <span
            className={`absolute inset-y-0 left-0 z-10 w-1 ${LEAD_PRIORITY_ACCENTS[lead.priority]}`}
            aria-hidden
          />
        ) : null}
        <div className="relative">
          {photo ? (
            <img src={photo} alt={title} loading="lazy" className="aspect-[4/3] w-full object-cover" />
          ) : (
            <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 bg-muted text-xs text-muted-foreground">
              <ImageOff className="size-5" aria-hidden />
              No photo
            </div>
          )}
          <div className="absolute top-2 left-2 z-10">
            <StatusMenu
              leadId={lead.id}
              value={lead.status}
              onStatusChange={handlers.onStatusChange}
              onAddNote={handlers.onAddNote}
            />
          </div>
          {lead.isDuplicate ? (
            <span className="absolute bottom-2 left-2 z-10 rounded-sm bg-orange-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
              DUPLICATE
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-0.5 p-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">Expected</p>
              <p className="text-xl leading-tight font-bold text-black">
                {lead.expectedPrice != null ? `₹${inr.format(lead.expectedPrice)}` : "—"}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] font-semibold tracking-wide text-gray-400 uppercase">Our price</p>
              <p className="text-xl leading-tight font-bold text-black">
                {lead.ourPrice != null ? `₹${inr.format(lead.ourPrice)}` : "—"}
              </p>
            </div>
          </div>
          <p className="text-sm leading-tight text-gray-700">{yearKmOwners(lead)}</p>
          <p className="truncate text-sm leading-tight text-gray-500">{title}</p>
          <p className="truncate text-xs leading-tight text-gray-500">{lead.source || "—"}</p>
          <p className="mt-1.5 flex items-center justify-between gap-2 text-xs leading-tight text-gray-400">
            {waLink ? (
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                aria-label={`Chat with ${lead.customerName || "customer"} on WhatsApp`}
                className="truncate text-green-700 underline-offset-4 hover:underline"
              >
                {lead.phone}
              </a>
            ) : (
              <span className="truncate">—</span>
            )}
            <span className="shrink-0">{formatLeadDate(lead.leadDate ?? lead.createdAt)}</span>
          </p>
        </div>
      </article>

      <LeadDrawer
        key={open ? `open-${lead.id}` : "closed"}
        lead={lead}
        handlers={handlers}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
