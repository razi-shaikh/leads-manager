// SOT:quick-notes
// WHAT: One-click note templates shown below note inputs.
// WHY:  Follow-up notes repeat the same call outcomes; picking beats typing.
// HOW:  Pure list; UI lives in quick-note-suggestions.tsx.
// WHERE: Lead drawer notes + status-change note dialog.

export const QUICK_NOTE_TEMPLATES = [
  "Call not answered - Message sent on WhatsApp",
  "Call not reachable - Message sent on WhatsApp",
  "Wrong number",
  "Call not answered, number not available on WhatsApp",
  "Customer is busy, will call back later",
] as const;

export type QuickNoteTemplate = (typeof QUICK_NOTE_TEMPLATES)[number];

/**
 * Insert a template into existing draft text: fills empty drafts,
 * otherwise appends on a new line so typed words are never lost.
 */
export function applyQuickNote(draft: string, template: QuickNoteTemplate): string {
  const trimmed = draft.trimEnd();
  if (!trimmed) return template;
  return `${trimmed}\n${template}`;
}
