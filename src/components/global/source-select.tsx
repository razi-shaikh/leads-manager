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

// SOT:source-select
// WHAT: Lead-source filter select — pushes ?source=, resets ?page=.
// WHY:  Shared by All Leads and Pipeline.
// HOW:  Client select driving URL params; server pages re-query.
// WHERE: List page toolbars.

export function SourceSelect({ sources }: { sources: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const active = params.get("source") ?? "all";

  function handleChange(value: string | null) {
    if (!value) return;
    const next = new URLSearchParams(params.toString());
    if (value === "all") {
      next.delete("source");
    } else {
      next.set("source", value);
    }
    next.delete("page");
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <Select value={sources.includes(active) ? active : "all"} onValueChange={handleChange}>
      <SelectTrigger aria-label="Filter by lead source" className="w-44 text-[15px]">
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
