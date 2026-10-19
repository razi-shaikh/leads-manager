// SOT:format
// WHAT: Shared client-safe formatters (dates, currency, numbers).
// WHY:  One formatting voice across cards, dialogs, and timelines.
// HOW:  Pure functions; import anywhere including client components.
// WHERE: Lead dialogs and timelines (cards keep their local copies minimal).

const dateTime = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDateTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateTime.format(date);
}

/** Owner count for cards: 1 → "1st Owner", 2 → "2nd Owner", 11 → "11th Owner". */
export function formatOwnerCount(owners: number | null | undefined): string | null {
  if (owners === null || owners === undefined) return null;
  const mod100 = owners % 100;
  const suffix =
    mod100 >= 11 && mod100 <= 13 ? "th" : owners % 10 === 1 ? "st" : owners % 10 === 2 ? "nd" : owners % 10 === 3 ? "rd" : "th";
  return `${owners}${suffix} Owner`;
}

/** Compact card date: "TODAY" for today, else "SEP 22" (uppercase). */
export function formatLeadDate(value: Date | string | null): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const now = new Date();
  if (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  ) {
    return "TODAY";
  }
  const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
  return `${month} ${date.getDate()}`;
}
