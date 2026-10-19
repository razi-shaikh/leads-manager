import { describe, expect, it } from "vitest";

import { statusNoteRequirement } from "./lead-status";

describe("statusNoteRequirement", () => {
  it("requires a note for any move into Follow-up", () => {
    for (const from of ["new_lead", "qualified", "negotiation", "closed_won"] as const) {
      const rule = statusNoteRequirement(from, "follow_up");
      expect(rule).toEqual({ required: true, title: "Move to Follow-up", label: "Follow-up note (required)" });
    }
  });

  it("requires a note for Follow-up into Negotiation", () => {
    expect(statusNoteRequirement("follow_up", "negotiation")).toEqual({
      required: true,
      title: "Move to Negotiation",
      label: "Negotiation note (required)",
    });
  });

  it("requires a reason for Negotiation into Closed Won", () => {
    expect(statusNoteRequirement("negotiation", "closed_won")).toEqual({
      required: true,
      title: "Close as won",
      label: "Win reason (required)",
    });
  });

  it("requires a note for any move into Closed Lost", () => {
    for (const from of ["new_lead", "qualified", "follow_up", "negotiation", "closed_won"] as const) {
      const rule = statusNoteRequirement(from, "closed_lost");
      expect(rule).toEqual({ required: true, title: "Close as lost", label: "Loss reason (required)" });
    }
  });

  it("requires a note for Qualified into Negotiation or Closed Won", () => {
    expect(statusNoteRequirement("qualified", "negotiation")).toEqual({
      required: true,
      title: "Move to Negotiation",
      label: "Negotiation note (required)",
    });
    expect(statusNoteRequirement("qualified", "closed_won")).toEqual({
      required: true,
      title: "Move to Closed Won",
      label: "Note (required)",
    });
  });

  it("lets Qualified back into New Lead through without a note", () => {
    expect(statusNoteRequirement("qualified", "new_lead")).toEqual({ required: false });
  });

  it("lets all other moves through without a note", () => {
    expect(statusNoteRequirement("new_lead", "qualified")).toEqual({ required: false });
    expect(statusNoteRequirement("follow_up", "closed_won")).toEqual({ required: false });
    expect(statusNoteRequirement("new_lead", "new_lead")).toEqual({ required: false });
  });
});
