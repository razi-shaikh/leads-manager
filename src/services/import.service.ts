import "server-only";

import {
  createLead,
  findDuplicateCandidate,
  type CreateLeadInput,
} from "./lead.service";
import { recordEvent } from "./event.service";

// SOT:import-service
// WHAT: Persists validated CSV rows as New Leads with duplicate tagging.
// WHY:  Import is validate-all-first (csv.ts), then create-all here.
// HOW:  Called by importAction only (which enforces auth).
// WHERE: /import page action.

export type ImportResult = { created: number; duplicates: number };

export async function importLeadRows(rows: CreateLeadInput[]): Promise<ImportResult> {
  let created = 0;
  let duplicates = 0;
  for (const row of rows) {
    const existing = await findDuplicateCandidate(row.phone ?? "", row.regNo ?? "");
    const lead = await createLead({
      ...row,
      status: "new_lead",
      isDuplicate: existing !== null,
    });
    if (existing) duplicates += 1;
    created += 1;
    await recordEvent({
      leadId: lead.id,
      type: "import",
      detail: `Imported from ${row.source}`,
    });
  }
  return { created, duplicates };
}
