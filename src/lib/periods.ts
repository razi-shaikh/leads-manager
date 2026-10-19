// SOT:periods
// WHAT: IST calendar-period boundaries (day / week / month starts) for analytics.
// WHY:  "Today / this week / this month" must follow the user's day in India,
//       identically on local dev (IST) and Vercel (UTC).
// HOW:  Pure functions over an instant; weeks start Monday.
// WHERE: Imported by stats.service; tested in periods.test.ts.

/** Asia/Kolkata offset ahead of UTC — no DST, safe as a constant. */
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

export type PeriodStarts = {
  /** Instant the current IST calendar day started. */
  day: Date;
  /** Instant the current IST week (Monday) started. */
  week: Date;
  /** Instant the current IST month started. */
  month: Date;
};

/** Activity tab selected by the user on the dashboard. */
export type ActivityPeriod = "today" | "week" | "month";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

type IstParts = { year: number; month: number; date: number };

function istParts(instant: Date): IstParts {
  const ist = new Date(instant.getTime() + IST_OFFSET_MS);
  return {
    year: ist.getUTCFullYear(),
    month: ist.getUTCMonth(),
    date: ist.getUTCDate(),
  };
}

/**
 * Human label for the selected period: "19 Oct 2026" (today),
 * "12 – 18 Oct 2026" (week), "Oct 2026" (month).
 */
export function formatPeriodLabel(period: ActivityPeriod, starts: PeriodStarts): string {
  const from = period === "today" ? starts.day : period === "week" ? starts.week : starts.month;
  const f = istParts(from);
  if (period === "month") return `${MONTHS[f.month]} ${f.year}`;
  if (period === "today") return `${f.date} ${MONTHS[f.month]} ${f.year}`;
  const end = new Date(from.getTime() + 6 * 24 * 60 * 60 * 1000);
  const t = istParts(end);
  if (t.month === f.month) return `${f.date} – ${t.date} ${MONTHS[f.month]} ${f.year}`;
  return `${f.date} ${MONTHS[f.month]} – ${t.date} ${MONTHS[t.month]} ${f.year}`;
}

export function getPeriodStarts(now: Date = new Date()): PeriodStarts {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  const year = ist.getUTCFullYear();
  const month = ist.getUTCMonth();
  const date = ist.getUTCDate();
  const backToMonday = (ist.getUTCDay() + 6) % 7;
  return {
    day: new Date(Date.UTC(year, month, date) - IST_OFFSET_MS),
    week: new Date(Date.UTC(year, month, date - backToMonday) - IST_OFFSET_MS),
    month: new Date(Date.UTC(year, month, 1) - IST_OFFSET_MS),
  };
}
