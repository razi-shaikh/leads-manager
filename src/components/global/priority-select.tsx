"use client";

import { useState, useTransition } from "react";
import { Flame, Snowflake, Sun } from "lucide-react";
import { toast } from "sonner";

import {
  LEAD_PRIORITIES,
  LEAD_PRIORITY_LABELS,
  type LeadPriority,
} from "@/lib/lead-priority";

// SOT:priority-select
// WHAT: Hot / Warm / Cold segmented control (priority is optional).
// WHY:  Replaces the featured flag; the card shows only the accent color.
// HOW:  Clicking the active priority clears it back to unset. Optimistic.
// WHERE: LeadDrawer, next to the status dropdown.

const ACTIVE: Record<LeadPriority, string> = {
  hot: "bg-red-500 text-white",
  warm: "bg-amber-400 text-black",
  cold: "bg-sky-500 text-white",
};

const ICONS = {
  hot: Flame,
  warm: Sun,
  cold: Snowflake,
} as const;

export function PrioritySelect({
  leadId,
  value,
  onSetPriority,
}: {
  leadId: string;
  value: LeadPriority | null;
  onSetPriority: (
    leadId: string,
    priority: LeadPriority | null,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const [current, setCurrent] = useState<LeadPriority | null>(value);
  const [pending, startTransition] = useTransition();
  // Sync from the server on external changes: render-phase adjustment.
  const [lastValue, setLastValue] = useState<LeadPriority | null>(value);
  if (value !== lastValue) {
    setLastValue(value);
    setCurrent(value);
  }

  function handleClick(priority: LeadPriority) {
    if (pending) return;
    const next = priority === current ? null : priority;
    const previous = current;
    setCurrent(next);
    startTransition(async () => {
      const result = await onSetPriority(leadId, next);
      if (!result.ok) {
        setCurrent(previous);
        toast.error("Could not update priority", { description: result.error });
      } else {
        toast.success(next ? `Priority set to ${LEAD_PRIORITY_LABELS[next]}` : "Priority cleared");
      }
    });
  }

  return (
    <div role="group" aria-label="Lead priority" className="flex gap-1 rounded-lg border bg-card p-1">
      {LEAD_PRIORITIES.map((priority) => {
        const Icon = ICONS[priority];
        const active = priority === current;
        return (
          <button
            key={priority}
            type="button"
            aria-pressed={active}
            disabled={pending}
            onClick={() => handleClick(priority)}
            className={`flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
              active ? ACTIVE[priority] : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="size-3.5" aria-hidden />
            {LEAD_PRIORITY_LABELS[priority]}
          </button>
        );
      })}
    </div>
  );
}
