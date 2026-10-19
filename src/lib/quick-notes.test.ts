import { describe, expect, it } from "vitest";

import { applyQuickNote, QUICK_NOTE_TEMPLATES } from "./quick-notes";

describe("quick note templates", () => {
  it("offers the five agreed call-outcome notes, each once", () => {
    expect([...QUICK_NOTE_TEMPLATES]).toEqual([
      "Call not answered - Message sent on WhatsApp",
      "Call not reachable - Message sent on WhatsApp",
      "Wrong number",
      "Call not answered, number not available on WhatsApp",
      "Customer is busy, will call back later",
    ]);
    expect(new Set(QUICK_NOTE_TEMPLATES).size).toBe(QUICK_NOTE_TEMPLATES.length);
  });
});

describe("applyQuickNote", () => {
  it("fills an empty draft with the template", () => {
    expect(applyQuickNote("", QUICK_NOTE_TEMPLATES[2])).toBe("Wrong number");
    expect(applyQuickNote("   ", QUICK_NOTE_TEMPLATES[2])).toBe("Wrong number");
  });

  it("appends on a new line without losing typed text", () => {
    expect(applyQuickNote("Tried twice", QUICK_NOTE_TEMPLATES[0])).toBe(
      "Tried twice\nCall not answered - Message sent on WhatsApp",
    );
  });
});
