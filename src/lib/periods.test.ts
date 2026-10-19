import { describe, expect, it } from "vitest";

import { formatPeriodLabel, getPeriodStarts } from "./periods";

const iso = (d: Date) => d.toISOString();

describe("getPeriodStarts", () => {
  it("buckets a Sunday afternoon IST into the week starting the previous Monday", () => {
    // 2026-10-18 15:30 IST (Sunday).
    const { day, week, month } = getPeriodStarts(new Date("2026-10-18T10:00:00Z"));
    expect(iso(day)).toBe("2026-10-17T18:30:00.000Z"); // Oct 18 00:00 IST
    expect(iso(week)).toBe("2026-10-11T18:30:00.000Z"); // Oct 12 (Mon) 00:00 IST
    expect(iso(month)).toBe("2026-09-30T18:30:00.000Z"); // Oct 1 00:00 IST
  });

  it("rolls day and week over at IST midnight, not UTC midnight", () => {
    // 23:30 IST Sunday Oct 18 → still Sunday's day and the same week.
    const sunday = getPeriodStarts(new Date("2026-10-18T18:00:00Z"));
    expect(iso(sunday.day)).toBe("2026-10-17T18:30:00.000Z");
    expect(iso(sunday.week)).toBe("2026-10-11T18:30:00.000Z");
    // 00:30 IST Monday Oct 19 → new day and a new week starting Oct 19.
    const monday = getPeriodStarts(new Date("2026-10-18T19:00:00Z"));
    expect(iso(monday.day)).toBe("2026-10-18T18:30:00.000Z");
    expect(iso(monday.week)).toBe("2026-10-18T18:30:00.000Z");
  });

  it("starts the month on the 1st IST", () => {
    const { month } = getPeriodStarts(new Date("2026-11-05T12:00:00Z"));
    expect(iso(month)).toBe("2026-10-31T18:30:00.000Z"); // Nov 1 00:00 IST
  });
});

describe("formatPeriodLabel", () => {
  it("labels today, week, and month like the reference", () => {
    const starts = getPeriodStarts(new Date("2026-10-18T10:00:00Z")); // Sun Oct 18 IST
    expect(formatPeriodLabel("today", starts)).toBe("18 Oct 2026");
    expect(formatPeriodLabel("week", starts)).toBe("12 – 18 Oct 2026");
    expect(formatPeriodLabel("month", starts)).toBe("Oct 2026");
  });

  it("spans month names when the week crosses a boundary", () => {
    const starts = getPeriodStarts(new Date("2026-10-01T10:00:00Z")); // Thu Oct 1 IST
    expect(formatPeriodLabel("week", starts)).toBe("28 Sep – 4 Oct 2026");
  });
});
