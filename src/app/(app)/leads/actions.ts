"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSession } from "@/lib/auth";
import {
  deleteLead,
  setLeadFavorite,
  setLeadFeatured,
  setLeadStatus,
  setStatusSchema,
  updateLead,
  updateLeadSchema,
  type UpdateLeadInput,
} from "@/services/lead.service";
import { addNote, addNoteSchema, listNotes } from "@/services/note.service";
import { listEvents } from "@/services/event.service";
import { uploadLeadPhotos } from "@/services/photo.service";
import type { LeadEvent, LeadNote } from "@/db/schema";
import type { LeadStatus } from "@/lib/lead-status";

// SOT:lead-actions
// WHAT: Lead mutations from cards — status, notes, details, edit, delete.
// WHY:  Every mutation verifies session + input before touching the service.
// HOW:  Called by LeadCard + dialogs; revalidates list pages so counts stay fresh.
// WHERE: All Leads and Pipeline pages.

export async function updateStatusAction(
  leadId: string,
  status: LeadStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireSession();
  const parsed = setStatusSchema.safeParse({ id: leadId, status });
  if (!parsed.success) return { ok: false, error: "Invalid status change." };
  try {
    await setLeadStatus(parsed.data.id, parsed.data.status);
  } catch {
    return { ok: false, error: "Could not update the status. Try again." };
  }
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  return { ok: true };
}

function revalidateLists(): void {
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
}

const uuidSchema = z.string().uuid("Invalid lead id");

export async function addNoteAction(
  leadId: string,
  text: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireSession();
  const parsed = addNoteSchema.safeParse({ leadId, text });
  if (!parsed.success) return { ok: false, error: "Note cannot be empty." };
  try {
    await addNote(parsed.data.leadId, parsed.data.text);
  } catch {
    return { ok: false, error: "Could not save the note. Try again." };
  }
  revalidateLists();
  return { ok: true };
}

export async function loadDetailsAction(
  leadId: string,
): Promise<
  | { ok: true; notes: LeadNote[]; events: LeadEvent[] }
  | { ok: false; error: string }
> {
  await requireSession();
  if (!uuidSchema.safeParse(leadId).success) {
    return { ok: false, error: "Invalid lead id." };
  }
  try {
    const [notes, events] = await Promise.all([listNotes(leadId), listEvents(leadId)]);
    return { ok: true, notes, events };
  } catch {
    return { ok: false, error: "Could not load details. Try again." };
  }
}

export async function updateLeadAction(
  leadId: string,
  patch: UpdateLeadInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireSession();
  if (!uuidSchema.safeParse(leadId).success) {
    return { ok: false, error: "Invalid lead id." };
  }
  const parsed = updateLeadSchema.safeParse(patch);
  if (!parsed.success) return { ok: false, error: "Some fields are invalid." };
  try {
    await updateLead(leadId, parsed.data);
  } catch {
    return { ok: false, error: "Could not save changes. Try again." };
  }
  revalidateLists();
  return { ok: true };
}

export async function uploadPhotosAction(
  leadId: string,
  formData: FormData,
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  await requireSession();
  if (!uuidSchema.safeParse(leadId).success) {
    return { ok: false, error: "Invalid lead id." };
  }
  const files = formData.getAll("photos").filter((f): f is File => f instanceof File);
  try {
    const urls = await uploadLeadPhotos(leadId, files);
    revalidateLists();
    return { ok: true, count: urls.length };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Upload failed. Try again.",
    };
  }
}

const toggleSchema = z.object({
  leadId: z.string().uuid("Invalid lead id"),
  value: z.boolean(),
});

export async function toggleFavoriteAction(
  leadId: string,
  value: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireSession();
  if (!toggleSchema.safeParse({ leadId, value }).success) {
    return { ok: false, error: "Invalid request." };
  }
  try {
    await setLeadFavorite(leadId, value);
  } catch {
    return { ok: false, error: "Could not update favorite. Try again." };
  }
  revalidateLists();
  return { ok: true };
}

export async function toggleFeaturedAction(
  leadId: string,
  value: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireSession();
  if (!toggleSchema.safeParse({ leadId, value }).success) {
    return { ok: false, error: "Invalid request." };
  }
  try {
    await setLeadFeatured(leadId, value);
  } catch {
    return { ok: false, error: "Could not update featured flag. Try again." };
  }
  revalidateLists();
  return { ok: true };
}

export async function deleteLeadAction(
  leadId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireSession();
  if (!uuidSchema.safeParse(leadId).success) {
    return { ok: false, error: "Invalid lead id." };
  }
  try {
    await deleteLead(leadId);
  } catch {
    return { ok: false, error: "Could not delete the lead. Try again." };
  }
  revalidateLists();
  return { ok: true };
}
