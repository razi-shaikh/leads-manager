"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth";
import { MAX_CSV_BYTES, parseBboCsv, parseLeadCsv, type CsvRowError } from "@/lib/csv";
import { findDuplicateCandidate } from "@/services/lead.service";
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

export type PreviewRow = {
  name: string;
  phone: string;
  bike: string;
  expectedPrice: number | null;
  ourPrice: number | null;
  source: string;
  duplicate: boolean;
};

export type PreviewState =
  | { status: "idle" }
  | { status: "error"; fileError: string }
  | {
      status: "ready";
      fileName: string;
      total: number;
      shown: number;
      duplicates: number;
      rows: PreviewRow[];
    };

const PREVIEW_ROWS = 25;
const PREVIEW_DUP_CHECK = 500;

export async function previewCsvAction(text: string, fileName: string): Promise<PreviewState> {
  await requireSession();
  if (text.length > MAX_CSV_BYTES) {
    return { status: "error", fileError: "File is too large (max 5 MB)." };
  }
  const parsed = parseLeadCsv(text);
  if (!parsed.ok) {
    const first = parsed.rowErrors[0];
    return {
      status: "error",
      fileError: first
        ? `${parsed.fileError} First problem — row ${first.row}: ${first.message}`
        : parsed.fileError,
    };
  }
  const checked = parsed.rows.slice(0, PREVIEW_DUP_CHECK);
  let duplicates = 0;
  const rows: PreviewRow[] = [];
  for (const [index, row] of checked.entries()) {
    const existing = await findDuplicateCandidate(row.phone ?? "", row.regNo ?? "");
    const duplicate = existing !== null;
    if (duplicate) duplicates += 1;
    if (index < PREVIEW_ROWS) {
      rows.push({
        name: row.customerName || "—",
        phone: row.phone || "—",
        bike: row.brandModel || "—",
        expectedPrice: row.expectedPrice ?? null,
        ourPrice: row.ourPrice ?? null,
        source: row.source,
        duplicate,
      });
    }
  }
  return {
    status: "ready",
    fileName,
    total: parsed.rows.length,
    shown: rows.length,
    duplicates,
    rows,
  };
}

export async function previewBboCsvAction(text: string, fileName: string): Promise<PreviewState> {
  await requireSession();
  if (text.length > MAX_CSV_BYTES) {
    return { status: "error", fileError: "File is too large (max 5 MB)." };
  }
  const parsed = parseBboCsv(text);
  if (!parsed.ok) {
    const first = parsed.rowErrors[0];
    return {
      status: "error",
      fileError: first
        ? `${parsed.fileError} First problem — row ${first.row}: ${first.message}`
        : parsed.fileError,
    };
  }
  const checked = parsed.rows.slice(0, PREVIEW_DUP_CHECK);
  let duplicates = 0;
  const rows: PreviewRow[] = [];
  for (const [index, row] of checked.entries()) {
    const existing = await findDuplicateCandidate(row.phone ?? "", row.regNo ?? "");
    const duplicate = existing !== null;
    if (duplicate) duplicates += 1;
    if (index < PREVIEW_ROWS) {
      rows.push({
        name: row.customerName || "—",
        phone: row.phone || "—",
        bike: row.brandModel || "—",
        expectedPrice: row.expectedPrice ?? null,
        ourPrice: row.ourPrice ?? null,
        source: row.source,
        duplicate,
      });
    }
  }
  return {
    status: "ready",
    fileName,
    total: parsed.rows.length,
    shown: rows.length,
    duplicates,
    rows,
  };
}

export async function importBboAction(
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

  const parsed = parseBboCsv(text);
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
