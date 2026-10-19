import { z } from "zod";

// SOT:lead-priority
// WHAT: Canonical lead priorities (Hot/Warm/Cold), labels, and card colors.
// WHY:  One definition shared by DB layer, validation, and UI — no drift.
// HOW:  Priority is optional (null = unset); the card shows only a color
//       accent, never text.
// WHERE: Used by services, actions, LeadCard, and PrioritySelect.

export const LEAD_PRIORITIES = ["hot", "warm", "cold"] as const;

export type LeadPriority = (typeof LEAD_PRIORITIES)[number];

export const leadPrioritySchema = z.enum(LEAD_PRIORITIES);

export const LEAD_PRIORITY_LABELS: Record<LeadPriority, string> = {
  hot: "Hot",
  warm: "Warm",
  cold: "Cold",
};

/** Card accent bar color per priority (solid, no text). */
export const LEAD_PRIORITY_ACCENTS: Record<LeadPriority, string> = {
  hot: "bg-red-500",
  warm: "bg-amber-400",
  cold: "bg-sky-400",
};
