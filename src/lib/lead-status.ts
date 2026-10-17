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

export const KNOWN_SOURCES = ["BikeBecho.com", "Bike4Sale", "Facebook"] as const;

export type KnownSource = (typeof KNOWN_SOURCES)[number];

export const LEADS_PER_PAGE = 50;
