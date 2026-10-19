import { describe, expect, it } from "vitest";

import { formatLeadDate, formatOwnerCount } from "./format";

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

describe("formatOwnerCount", () => {
  it("uses st/nd/rd suffixes for 1/2/3", () => {
    expect(formatOwnerCount(1)).toBe("1st Owner");
    expect(formatOwnerCount(2)).toBe("2nd Owner");
    expect(formatOwnerCount(3)).toBe("3rd Owner");
  });

  it("uses th otherwise, including the 11/12/13 teens", () => {
    expect(formatOwnerCount(4)).toBe("4th Owner");
    expect(formatOwnerCount(11)).toBe("11th Owner");
    expect(formatOwnerCount(12)).toBe("12th Owner");
    expect(formatOwnerCount(13)).toBe("13th Owner");
    expect(formatOwnerCount(21)).toBe("21st Owner");
  });

  it("returns null when unknown", () => {
    expect(formatOwnerCount(null)).toBeNull();
    expect(formatOwnerCount(undefined)).toBeNull();
  });
});
