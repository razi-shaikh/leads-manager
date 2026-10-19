"use client";

import { useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// SOT:source-filter
// WHAT: Dashboard source scope selector — All + known sources.
// WHY:  Counts update per source (PRD FR-D3) via the ?source= param.
// HOW:  Client select pushing a new URL; server page re-reads counts.
// WHERE: /dashboard header.

export function SourceFilter({ sources, active }: { sources: string[]; active: string }) {
  const router = useRouter();
  const params = useSearchParams();

  function handleChange(value: string | null) {
    if (!value) return;
    const next = new URLSearchParams(params.toString());
    if (value === "all") {
      next.delete("source");
    } else {
      next.set("source", value);
    }
    const query = next.toString();
    router.push(query ? `/dashboard?${query}` : "/dashboard");
  }

  return (
    <Select value={active} onValueChange={handleChange}>
      <SelectTrigger aria-label="Filter by lead source" className="w-48 text-[15px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="all">All sources</SelectItem>
          {sources.map((source) => (
            <SelectItem key={source} value={source}>
              {source}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
