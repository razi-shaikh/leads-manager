"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

// SOT:search-bar
// WHAT: Debounced lead search — pushes ?q= (name, phone, reg no.).
// WHY:  Shared by All Leads and Pipeline (PRD FR-L2/FR-P3).
// HOW:  400ms debounce; clears ?page= on change; syncs from URL on back/nav.
// WHERE: List page toolbars.

export function SearchBar({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const paramQ = params.get("q") ?? "";
  const [value, setValue] = useState(paramQ);
  // Sync from URL on back/forward nav: render-phase adjustment (no effect).
  const [syncedQ, setSyncedQ] = useState(paramQ);
  if (paramQ !== syncedQ) {
    setSyncedQ(paramQ);
    setValue(paramQ);
  }

  useEffect(() => {
    const current = params.get("q") ?? "";
    if (value === current) return;
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (value.trim()) {
        next.set("q", value.trim());
      } else {
        next.delete("q");
      }
      next.delete("page");
      const query = next.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    }, 400);
    return () => clearTimeout(timer);
  }, [value, params, pathname, router]);

  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Search leads"
        className="pl-8"
      />
    </div>
  );
}
