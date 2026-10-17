import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { leadEvents, type LeadEvent } from "@/db/schema";
import type { LeadStatus } from "@/lib/lead-status";

// SOT:event-service SOT:history
// WHAT: History timeline persistence — record + list lead events.
// WHY:  Every status change, note, edit, import, and photo add leaves an audit trail.
// HOW:  Called by the other services after each mutation; read by history UI actions.
// WHERE: Consumed by lead/note/import/photo services and lead detail actions.

export type LeadEventType = LeadEvent["type"];

export async function recordEvent(input: {
  leadId: string;
  type: LeadEventType;
  fromStatus?: LeadStatus | null;
  toStatus?: LeadStatus | null;
  detail?: string | null;
}): Promise<LeadEvent> {
  const [event] = await db
    .insert(leadEvents)
    .values({
      leadId: input.leadId,
      type: input.type,
      fromStatus: input.fromStatus ?? null,
      toStatus: input.toStatus ?? null,
      detail: input.detail ?? null,
    })
    .returning();
  if (!event) throw new Error("Failed to record lead event");
  return event;
}

export async function listEvents(leadId: string): Promise<LeadEvent[]> {
  return db
    .select()
    .from(leadEvents)
    .where(eq(leadEvents.leadId, leadId))
    .orderBy(desc(leadEvents.createdAt));
}
