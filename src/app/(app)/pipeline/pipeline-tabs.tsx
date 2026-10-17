"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LEAD_STATUS_LABELS, PIPELINE_STATUSES, type LeadStatus } from "@/lib/lead-status";

// SOT:pipeline-tabs
// WHAT: Pipeline stage tabs — pushes ?tab=, resets ?page=.
// WHY:  All five non-New stages directly visible; Qualified by default (FR-P1/P2).
// HOW:  Client tabs driving URL params; server page re-queries per stage.
// WHERE: /pipeline header.

export function PipelineTabs({ active }: { active: LeadStatus }) {
  const router = useRouter();
  const params = useSearchParams();

  function handleChange(value: string | number | null) {
    if (typeof value !== "string" || !value) return;
    const next = new URLSearchParams(params.toString());
    next.set("tab", value);
    next.delete("page");
    router.push(`/pipeline?${next.toString()}`);
  }

  return (
    <Tabs value={active} onValueChange={handleChange}>
      <TabsList aria-label="Pipeline stages" className="max-w-full overflow-x-auto">
        {PIPELINE_STATUSES.map((status) => (
          <TabsTrigger key={status} value={status}>
            {LEAD_STATUS_LABELS[status]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
