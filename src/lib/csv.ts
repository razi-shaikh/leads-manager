import Papa from "papaparse";

import type { CreateLeadInput } from "@/services/lead.service";

// SOT:csv-parse SOT:csv-import
// WHAT: CSV parsing + validation + transformation into lead rows (server-side).
// WHY:  Daily imports must reject malformed files before creating anything (FR-I4).
// HOW:  parseLeadCsv validates headers, then every row; importAction persists.
// WHERE: /import action. Pure functions — covered by csv.test.ts.

export const CSV_HEADERS = [
  "ID",
  "Lead Source",
  "Date",
  "Customer Name",
  "Phone",
  "Email",
  "Brand & Model",
  "Reg No.",
  "Year",
  "Bike Photo (Multiple photos)",
  "KM Driven",
  "No. of Owners",
  "Location",
  "Expected Price",
] as const;

export const MAX_CSV_BYTES = 5 * 1024 * 1024;

export type CsvRowError = { row: number; message: string };

export type CsvParseResult =
  | { ok: true; rows: CreateLeadInput[] }
  | { ok: false; fileError: string; rowErrors: CsvRowError[] };

type RawRow = Record<string, string>;

function toInt(raw: string | undefined): number | null {
  const cleaned = (raw ?? "").replace(/[^0-9.\-]/g, "").trim();
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
  const value = Math.round(Number(cleaned));
  return Number.isFinite(value) ? value : null;
}

function toPhotos(raw: string | undefined): string[] {
  // Assumption (PRD open item 2): multiple URLs are comma-separated.
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim().replace(/^"|"$/g, ""))
    .filter((s) => /^https?:\/\//i.test(s));
}

function toDate(raw: string | undefined): Date | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

function clean(raw: string | undefined): string {
  return (raw ?? "").trim();
}

function transformRow(raw: RawRow): CreateLeadInput {
  const year = toInt(raw["Year"]);
  return {
    externalId: clean(raw["ID"]) || null,
    source: clean(raw["Lead Source"]) || "Unknown",
    leadDate: toDate(raw["Date"]),
    customerName: clean(raw["Customer Name"]),
    phone: clean(raw["Phone"]),
    email: clean(raw["Email"]),
    brandModel: clean(raw["Brand & Model"]),
    regNo: clean(raw["Reg No."]),
    year: year !== null && year >= 1900 && year <= 2100 ? year : null,
    photos: toPhotos(raw["Bike Photo (Multiple photos)"]),
    kmDriven: toInt(raw["KM Driven"]),
    owners: toInt(raw["No. of Owners"]),
    location: clean(raw["Location"]),
    expectedPrice: toInt(raw["Expected Price"]),
    status: "new_lead",
    isDuplicate: false,
  };
}

export function parseLeadCsv(text: string): CsvParseResult {
  const withoutBom = text.replace(/^\uFEFF/, "");
  if (!withoutBom.trim()) {
    return { ok: false, fileError: "The file is empty.", rowErrors: [] };
  }

  const parsed = Papa.parse<RawRow>(withoutBom, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });

  if (parsed.errors.length > 0) {
    const first = parsed.errors[0];
    return {
      ok: false,
      fileError: `Could not parse the CSV (row ${first.row ?? "?"}: ${first.message}).`,
      rowErrors: [],
    };
  }

  const headers = parsed.meta.fields ?? [];
  // All columns are optional: import whatever is present, ignore the rest.
  // Only reject files with no recognized column at all (wrong file entirely).
  const recognized = CSV_HEADERS.filter((h) => headers.includes(h));
  if (recognized.length === 0) {
    return {
      ok: false,
      fileError: `No recognized columns found. Use any of: ${CSV_HEADERS.join(" | ")}.`,
      rowErrors: [],
    };
  }

  if (parsed.data.length === 0) {
    return { ok: false, fileError: "No data rows found.", rowErrors: [] };
  }

  const rows: CreateLeadInput[] = [];
  const rowErrors: CsvRowError[] = [];
  parsed.data.forEach((raw, index) => {
    try {
      rows.push(transformRow(raw));
    } catch (err) {
      rowErrors.push({
        row: index + 2,
        message: err instanceof Error ? err.message : "Invalid row",
      });
    }
  });

  if (rowErrors.length > 0) {
    return { ok: false, fileError: `${rowErrors.length} row(s) failed validation. Nothing was imported.`, rowErrors };
  }
  return { ok: true, rows };
}
