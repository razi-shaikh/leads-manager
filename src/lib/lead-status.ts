import { z } from "zod";

// SOT:lead-status SOT:lead-sources
// WHAT: Canonical lead statuses, labels, sources, and their Zod schemas.
// WHY:  One definition shared by DB layer, validation, and UI — no drift.
// HOW:  Imported by services, actions, and components. DB stores free-text
//       source for extensibility; KNOWN_SOURCES drives filter UI.
// WHERE: Used across services, actions, and all lead pages.

export const LEAD_STATUSES = [
  "new_lead",
  "qualified",
  "follow_up",
  "negotiation",
  "closed_won",
  "closed_lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const leadStatusSchema = z.enum(LEAD_STATUSES);

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new_lead: "New Lead",
  qualified: "Qualified",
  follow_up: "Follow-up",
  negotiation: "Negotiation",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

/** Pipeline tabs: every status except New Lead (PRD FR-P1). */
export const PIPELINE_STATUSES: LeadStatus[] = [
  "qualified",
  "follow_up",
  "negotiation",
  "closed_won",
  "closed_lost",
];

export const DEFAULT_PIPELINE_STATUS: LeadStatus = "qualified";

/** Badge variant token per status (see globals.css --status-*). */
export const LEAD_STATUS_TOKENS: Record<LeadStatus, string> = {
  new_lead: "new",
  qualified: "qualified",
  follow_up: "followup",
  negotiation: "negotiation",
  closed_won: "won",
  closed_lost: "lost",
};

export type StatusNoteRequirement =
  | { required: false }
  | { required: true; title: string; label: string };

/**
 * Moves that must record a note before the status changes:
 * - anything → Follow-up: note required
 * - Follow-up → Negotiation: note required
 * - Negotiation → Closed Won: reason required
 * - anything → Closed Lost: note required
 * - Qualified → anything except New Lead: note required (triage gate)
 * All other moves (e.g. New Lead → Qualified) change immediately.
 */
export function statusNoteRequirement(from: LeadStatus, to: LeadStatus): StatusNoteRequirement {
  if (from === to) return { required: false };
  if (to === "closed_lost") {
    return { required: true, title: "Close as lost", label: "Loss reason (required)" };
  }
  if (from === "negotiation" && to === "closed_won") {
    return { required: true, title: "Close as won", label: "Win reason (required)" };
  }
  if (to === "follow_up") {
    return { required: true, title: "Move to Follow-up", label: "Follow-up note (required)" };
  }
  if (from === "follow_up" && to === "negotiation") {
    return { required: true, title: "Move to Negotiation", label: "Negotiation note (required)" };
  }
  if (from === "qualified" && to !== "new_lead") {
    if (to === "negotiation") {
      return { required: true, title: "Move to Negotiation", label: "Negotiation note (required)" };
    }
    return { required: true, title: `Move to ${LEAD_STATUS_LABELS[to]}`, label: "Note (required)" };
  }
  return { required: false };
}

export const KNOWN_SOURCES = ["BikeBecho", "Bike4Sale", "Facebook"] as const;

export type KnownSource = (typeof KNOWN_SOURCES)[number];

export const LEADS_PER_PAGE = 50;
