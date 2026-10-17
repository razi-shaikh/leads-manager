"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/lead-status";

// SOT:status-dropdown
// WHAT: Status changer — shadcn Select with all six statuses, optimistic update.
// WHY:  Status changes from the card on every page (PRD FR-C3).
// HOW:  onStatusChange performs the server mutation; reverts + toasts on failure.
// WHERE: Footer of LeadCard on All Leads and Pipeline.

export function StatusDropdown({
  leadId,
  value,
  onStatusChange,
}: {
  leadId: string;
  value: LeadStatus;
  onStatusChange: (leadId: string, status: LeadStatus) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const [current, setCurrent] = useState<LeadStatus>(value);
  const [pending, startTransition] = useTransition();

  function handleChange(next: LeadStatus | null) {
    if (next === null) return;
    const status = next;
    if (!LEAD_STATUSES.includes(status) || status === current) return;
    const previous = current;
    setCurrent(status);
    startTransition(async () => {
      const result = await onStatusChange(leadId, status);
      if (!result.ok) {
        setCurrent(previous);
        toast.error("Status change failed", { description: result.error });
      } else {
        toast.success(`Moved to ${LEAD_STATUS_LABELS[status]}`);
      }
    });
  }

  return (
    <Select value={current} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger aria-label="Change lead status" className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {LEAD_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {LEAD_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
