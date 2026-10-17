import "server-only";

import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client";
import { leadNotes, leads, type LeadNote } from "@/db/schema";
import { recordEvent } from "./event.service";

// SOT:note-service
// WHAT: Database access layer for lead notes (plain text + timestamp).
// WHY:  Notes are append-only records with an audit event each.
// HOW:  Called from Server Actions only (which enforce auth).
// WHERE: Notes UI actions under /src/app/(app)/leads/.

export const addNoteSchema = z.object({
  leadId: z.string().uuid("Invalid lead id"),
  text: z.string().trim().min(1, "Note cannot be empty").max(2000),
});

export async function listNotes(leadId: string): Promise<LeadNote[]> {
  return db
    .select()
    .from(leadNotes)
    .where(eq(leadNotes.leadId, leadId))
    .orderBy(desc(leadNotes.createdAt));
}

export async function addNote(leadId: string, text: string): Promise<LeadNote> {
  const [lead] = await db.select({ id: leads.id }).from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!lead) throw new Error("Lead not found");
  const [note] = await db.insert(leadNotes).values({ leadId, text }).returning();
  if (!note) throw new Error("Failed to add note");
  await recordEvent({ leadId, type: "note", detail: text.slice(0, 200) });
  return note;
}
