"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/lead-status";

// SOT:status-select
// WHAT: Status filter select — pushes ?status=, resets ?page=.
// WHY:  All Leads can narrow to one status (PRD FR-L3).
// HOW:  Client select driving URL params; server page re-queries.
// WHERE: All Leads toolbar.

export function StatusSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const active = params.get("status") ?? "all";

  function handleChange(value: string | null) {
    if (!value) return;
    const next = new URLSearchParams(params.toString());
    if (value === "all") {
      next.delete("status");
    } else {
      next.set("status", value);
    }
    next.delete("page");
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <Select value={active} onValueChange={handleChange}>
      <SelectTrigger aria-label="Filter by status" className="w-44 text-[15px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="all">All statuses</SelectItem>
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
