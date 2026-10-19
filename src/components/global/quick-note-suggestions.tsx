"use client";

import { applyQuickNote, QUICK_NOTE_TEMPLATES, type QuickNoteTemplate } from "@/lib/quick-notes";
import { Button } from "@/components/ui/button";

// SOT:quick-note-suggestions
// WHAT: One-click note templates rendered as small chips below a note input.
// WHY:  Call outcomes repeat; tapping a chip beats retyping.
// HOW:  Appends the template to the draft (typed text kept); parent owns state.
// WHERE: Lead drawer notes + status-change note dialog.

export function QuickNoteSuggestions({
  draft,
  onPick,
}: {
  draft: string;
  onPick: (next: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Quick note suggestions">
      {QUICK_NOTE_TEMPLATES.map((template: QuickNoteTemplate) => (
        <Button
          key={template}
          type="button"
          variant="outline"
          size="sm"
          className="h-auto max-w-full rounded-full py-1 text-[13px] font-normal whitespace-normal text-left"
          onClick={() => onPick(applyQuickNote(draft, template))}
        >
          {template}
        </Button>
      ))}
    </div>
  );
}
