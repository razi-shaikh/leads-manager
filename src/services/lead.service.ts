import "server-only";

import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client";
import { leads, type Lead, type NewLead } from "@/db/schema";
import { LEAD_STATUSES, leadStatusSchema, type LeadStatus } from "@/lib/lead-status";
import { LEAD_PRIORITIES, type LeadPriority } from "@/lib/lead-priority";
import { recordEvent } from "./event.service";

// SOT:lead-service
// WHAT: Database access layer for leads. Only this file touches the leads table.
// WHY:  DB isolation — all lead queries and mutations flow through here.
// HOW:  Called from Server Actions / Route Handlers only (which enforce auth).
//       Auth is NOT checked here so scripts (seed) can reuse it.
// WHERE: /src/app/(app)/*/actions.ts, import + photo routes.

export const leadListFilterSchema = z.object({
  status: leadStatusSchema.optional(),
  source: z.string().trim().min(1).max(64).optional(),
  search: z.string().trim().max(128).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(50),
});

export type LeadListFilter = z.infer<typeof leadListFilterSchema>;

export const setStatusSchema = z.object({
  id: z.string().uuid("Invalid lead id"),
  status: leadStatusSchema,
});

export const updateLeadSchema = z.object({
  source: z.string().trim().min(1).max(64).optional(),
  customerName: z.string().trim().max(128).optional(),
  phone: z.string().trim().max(32).optional(),
  email: z.string().trim().max(128).optional(),
  brandModel: z.string().trim().max(128).optional(),
  regNo: z.string().trim().max(32).optional(),
  year: z.number().int().min(1900).max(2100).nullable().optional(),
  kmDriven: z.number().int().min(0).nullable().optional(),
  owners: z.number().int().min(0).nullable().optional(),
  location: z.string().trim().max(128).optional(),
  expectedPrice: z.number().int().min(0).nullable().optional(),
  ourPrice: z.number().int().min(0).nullable().optional(),
});

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

export type CreateLeadInput = Omit<NewLead, "id" | "createdAt" | "updatedAt">;

/** Manual creation: same fields as edit, but source is required. */
export const manualCreateSchema = updateLeadSchema.extend({
  source: z.string().trim().min(1).max(64),
});

export type ManualCreateInput = z.infer<typeof manualCreateSchema>;

function buildConditions(filter: LeadListFilter) {
  const conditions = [];
  if (filter.status) conditions.push(eq(leads.status, filter.status));
  if (filter.source) conditions.push(eq(leads.source, filter.source));
  const q = filter.search?.trim();
  if (q) {
    const like = `%${q}%`;
    conditions.push(
      or(
        ilike(leads.customerName, like),
        ilike(leads.phone, like),
        ilike(leads.regNo, like),
      ),
    );
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

export async function listLeads(filter: LeadListFilter): Promise<{
  items: Lead[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}> {
  const where = buildConditions(filter);
  const perPage = filter.perPage;
  const page = filter.page;

  const [countRow] = await db
    .select({ value: count() })
    .from(leads)
    .where(where);
  const total = countRow?.value ?? 0;

  const items = await db
    .select()
    .from(leads)
    .where(where)
    .orderBy(desc(leads.createdAt))
    .limit(perPage)
    .offset((page - 1) * perPage);

  return {
    items,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getLead(id: string): Promise<Lead | null> {
  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return lead ?? null;
}

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  const [lead] = await db.insert(leads).values(input).returning();
  if (!lead) throw new Error("Failed to create lead");
  return lead;
}

export async function createManualLead(input: ManualCreateInput): Promise<Lead> {
  const existing = await findDuplicateCandidate(input.phone ?? "", input.regNo ?? "");
  const lead = await createLead({
    externalId: null,
    source: input.source,
    leadDate: null,
    customerName: input.customerName ?? "",
    phone: input.phone ?? "",
    email: input.email ?? "",
    brandModel: input.brandModel ?? "",
    regNo: input.regNo ?? "",
    year: input.year ?? null,
    photos: [],
    kmDriven: input.kmDriven ?? null,
    owners: input.owners ?? null,
    location: input.location ?? "",
    expectedPrice: input.expectedPrice ?? null,
    ourPrice: input.ourPrice ?? null,
    status: "new_lead",
    isDuplicate: existing !== null,
  });
  await recordEvent({ leadId: lead.id, type: "import", detail: "Added manually" });
  return lead;
}

export async function setLeadStatus(id: string, status: LeadStatus): Promise<Lead> {
  if (!LEAD_STATUSES.includes(status)) throw new Error("Invalid status");
  const current = await getLead(id);
  if (!current) throw new Error("Lead not found");
  const [updated] = await db
    .update(leads)
    .set({ status, updatedAt: new Date() })
    .where(eq(leads.id, id))
    .returning();
  if (!updated) throw new Error("Failed to update lead status");
  if (current.status !== status) {
    await recordEvent({
      leadId: id,
      type: "status_change",
      fromStatus: current.status,
      toStatus: status,
    });
  }
  return updated;
}

export async function updateLead(id: string, patch: UpdateLeadInput): Promise<Lead> {
  const current = await getLead(id);
  if (!current) throw new Error("Lead not found");
  const [updated] = await db
    .update(leads)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(leads.id, id))
    .returning();
  if (!updated) throw new Error("Failed to update lead");
  const changed = Object.keys(patch).join(", ");
  await recordEvent({ leadId: id, type: "edit", detail: `Edited: ${changed}` });
  return updated;
}

export async function deleteLead(id: string): Promise<void> {
  await db.delete(leads).where(eq(leads.id, id));
}

export async function addLeadPhotos(id: string, urls: string[]): Promise<Lead> {
  const current = await getLead(id);
  if (!current) throw new Error("Lead not found");
  const photos = [...current.photos, ...urls];
  const [updated] = await db
    .update(leads)
    .set({ photos, updatedAt: new Date() })
    .where(eq(leads.id, id))
    .returning();
  if (!updated) throw new Error("Failed to add photos");
  await recordEvent({
    leadId: id,
    type: "photo",
    detail: `Added ${urls.length} photo${urls.length === 1 ? "" : "s"}`,
  });
  return updated;
}

export async function setLeadPriority(id: string, priority: LeadPriority | null): Promise<Lead> {
  if (priority !== null && !LEAD_PRIORITIES.includes(priority)) {
    throw new Error("Invalid priority");
  }
  const [updated] = await db
    .update(leads)
    .set({ priority, updatedAt: new Date() })
    .where(eq(leads.id, id))
    .returning();
  if (!updated) throw new Error("Lead not found");
  return updated;
}

export async function findDuplicateCandidate(
  phone: string,
  regNo: string,
): Promise<Lead | null> {
  const phoneNorm = phone.trim();
  const regNorm = regNo.trim();
  if (!phoneNorm || !regNorm) return null;
  const [lead] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.phone, phoneNorm), eq(leads.regNo, regNorm)))
    .limit(1);
  return lead ?? null;
}
