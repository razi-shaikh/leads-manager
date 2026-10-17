"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth";
import { MAX_CSV_BYTES, parseLeadCsv, type CsvRowError } from "@/lib/csv";
import { importLeadRows } from "@/services/import.service";

// SOT:import-action
// WHAT: CSV upload action — validates the file, imports rows, reports counts.
// WHY:  Upload + parse + persist must stay server-side with auth (FR-I1–I4).
// HOW:  ImportForm posts multipart FormData; result renders as a report.
// WHERE: /import page.

export type ImportState =
  | { status: "idle" }
  | { status: "success"; created: number; duplicates: number }
  | { status: "error"; fileError: string; rowErrors: CsvRowError[] };

export async function importAction(
  _prevState: ImportState,
  formData: FormData,
): Promise<ImportState> {
  await requireSession();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", fileError: "Choose a CSV file to upload.", rowErrors: [] };
  }
  if (file.size > MAX_CSV_BYTES) {
    return { status: "error", fileError: "File is too large (max 5 MB).", rowErrors: [] };
  }

  let text: string;
  try {
    text = await file.text();
  } catch {
    return { status: "error", fileError: "Could not read the file.", rowErrors: [] };
  }

  const parsed = parseLeadCsv(text);
  if (!parsed.ok) {
    return { status: "error", fileError: parsed.fileError, rowErrors: parsed.rowErrors };
  }

  try {
    const { created, duplicates } = await importLeadRows(parsed.rows);
    revalidatePath("/leads");
    revalidatePath("/dashboard");
    revalidatePath("/pipeline");
    return { status: "success", created, duplicates };
  } catch {
    return {
      status: "error",
      fileError: "Import failed partway. Re-check the file and try again.",
      rowErrors: [],
    };
  }
}
