"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

// SOT:refresh-button
// WHAT: Manual data reload — re-fetches the current route from the server.
// WHY:  Leads change from imports and status moves; one click shows fresh data.
// HOW:  router.refresh(); icon spins briefly as feedback (no promise to await).
// WHERE: All Leads and Pipeline headers.

export function RefreshButton() {
  const router = useRouter();
  const [spinning, setSpinning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function handleClick() {
    if (spinning) return;
    router.refresh();
    setSpinning(true);
    timer.current = setTimeout(() => setSpinning(false), 1200);
  }

  return (
    <Button type="button" variant="outline" onClick={handleClick} aria-label="Refresh leads">
      <RefreshCw data-icon="inline-start" className={spinning ? "animate-spin" : undefined} />
      Refresh
    </Button>
  );
}
