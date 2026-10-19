"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// SOT:auto-refresh
// WHAT: Revalidates the current route when returning to the tab or via back/forward.
// WHY:  A status moved on Pipeline (or in another tab) must show on All Leads
//       without a manual reload — cached back-navigations would stay stale.
// HOW:  pageshow covers bfcache back/forward restores; focus covers tab switches.
//       Client state (open drawers, form edits) is preserved by the refresh.
// WHERE: Rendered once by the authenticated (app) layout.

export function AutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => router.refresh();
    window.addEventListener("pageshow", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [router]);

  return null;
}
