import { describe, expect, it } from "vitest";

import { formatLeadDate } from "./format";

describe("formatLeadDate", () => {
  it("returns TODAY for today", () => {
    expect(formatLeadDate(new Date())).toBe("TODAY");
  });

  it("returns MMM D uppercase for other dates", () => {
    // Noon UTC avoids timezone day-shift for positive-offset zones in CI.
    expect(formatLeadDate(new Date("2026-09-22T12:00:00Z"))).toBe("SEP 22");
    expect(formatLeadDate("2026-01-05T12:00:00Z")).toBe("JAN 5");
  });

  it("returns a dash for missing or invalid dates", () => {
    expect(formatLeadDate(null)).toBe("—");
    expect(formatLeadDate("not-a-date")).toBe("—");
  });
});
