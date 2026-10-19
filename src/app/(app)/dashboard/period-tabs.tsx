"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ActivityPeriod } from "@/lib/periods";

// SOT:period-tabs
// WHAT: Today / This Week / This Month switcher driving the activity panels.
// WHY:  One manual control scopes every number below (reference design).
// HOW:  Client tabs pushing ?period= (source filter preserved); server page
//       re-queries per period.
// WHERE: /dashboard activity header.

const OPTIONS: { value: ActivityPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
];

export function PeriodTabs({ active }: { active: ActivityPeriod }) {
  const router = useRouter();
  const params = useSearchParams();

  function handleChange(value: string | number | null) {
    if (typeof value !== "string" || !value) return;
    const next = new URLSearchParams(params.toString());
    next.set("period", value);
    router.push(`/dashboard?${next.toString()}`);
  }

  return (
    <Tabs value={active} onValueChange={handleChange}>
      <TabsList aria-label="Activity period">
        {OPTIONS.map((option) => (
          <TabsTrigger key={option.value} value={option.value} className="text-[15px]">
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
