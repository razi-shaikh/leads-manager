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
  "Our Price",
] as const;

export const MAX_CSV_BYTES = 5 * 1024 * 1024;

/** Recognized BikeBecho (BBO) sell-request columns (all optional, any order). */
export const BBO_HEADERS = [
  "ID",
  "BBO",
  "Submitted At",
  "Owner Name",
  "Mobile Number",
  "Email",
  "City",
  "PIN Code",
  "Brand",
  "Model",
  "Variant",
  "Manufacturing Year",
  "Kilometers Driven",
  "Ownership",
  "Bike Condition",
  "Expected Price",
  "Exp. Price",
  "RegestrationNo",
  "Reg No.",
] as const;

/** Columns that only the BBO format has — used to tell the two formats apart. */
const BBO_SIGNATURE_HEADERS = [
  "Submitted At",
  "Owner Name",
  "Mobile Number",
  "Manufacturing Year",
  "Kilometers Driven",
  "Bike Condition",
] as const;

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

function toOwners(raw: string | undefined): number | null {
  const numeric = toInt(raw);
  if (numeric !== null) return numeric;
  const words: Record<string, number> = {
    first: 1,
    second: 2,
    third: 3,
    fourth: 4,
    fifth: 5,
    single: 1,
    one: 1,
    two: 2,
    three: 3,
  };
  const word = clean(raw)
    .toLowerCase()
    .replace(/owners?/g, "")
    .trim();
  return words[word] ?? null;
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
    ourPrice: toInt(raw["Our Price"]),
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

function transformBboRow(raw: RawRow): CreateLeadInput {
  const brandModel = [clean(raw["Brand"]), clean(raw["Model"]), clean(raw["Variant"])]
    .filter((part) => part !== "")
    .join(" ");
  // No condition column exists in our table: the condition rides along in Reg No.
  // Future files name the column "RegestrationNo"; accept both spellings.
  const regRaw = clean(raw["RegestrationNo"]) || clean(raw["Reg No."]);
  const condition = clean(raw["Bike Condition"]);
  const regNo = (regRaw + (condition ? ` (${condition})` : "")).trim();
  const location = [clean(raw["City"]), clean(raw["PIN Code"])]
    .filter((part) => part !== "")
    .join(", ");
  const year = toInt(raw["Manufacturing Year"]);
  const bbo = clean(raw["BBO"]);
  return {
    externalId: clean(raw["ID"]) || null,
    // A literal "BBO" marker (or blank) means the standard BikeBecho source;
    // any other value is kept as its own source.
    source: bbo !== "" && bbo.toLowerCase() !== "bbo" ? bbo : "BikeBecho",
    leadDate: toDate(raw["Submitted At"]),
    customerName: clean(raw["Owner Name"]),
    phone: clean(raw["Mobile Number"]),
    email: clean(raw["Email"]),
    brandModel,
    regNo,
    year: year !== null && year >= 1900 && year <= 2100 ? year : null,
    photos: toPhotos(raw["Photos"]),
    kmDriven: toInt(raw["Kilometers Driven"]),
    owners: toOwners(raw["Ownership"]),
    location,
    expectedPrice: toInt(raw["Expected Price"] ?? raw["Exp. Price"]),
    ourPrice: null,
    status: "new_lead",
    isDuplicate: false,
  };
}

export function parseBboCsv(text: string): CsvParseResult {
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
      ok: false, fileError: `Could not parse the CSV (row ${first.row ?? "?"}: ${first.message}).`,
      rowErrors: [],
    };
  }

  const headers = parsed.meta.fields ?? [];
  const recognized = BBO_HEADERS.filter((h) => headers.includes(h));
  if (recognized.length === 0) {
    return {
      ok: false,
      fileError: `No recognized BikeBecho columns found. Use any of: ${BBO_HEADERS.join(" | ")}.`,
      rowErrors: [],
    };
  }
  if (!BBO_SIGNATURE_HEADERS.some((h) => headers.includes(h))) {
    return {
      ok: false,
      fileError:
        "This does not look like a BikeBecho file (no Submitted At / Owner Name / Mobile Number columns). Use the standard import instead.",
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
      rows.push(transformBboRow(raw));
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
