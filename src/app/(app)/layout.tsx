import { requireSession } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import { AppNav } from "./nav";

// SOT:app-layout
// WHAT: Authenticated shell — session guard, top nav, toast host.
// WHY:  Every /dashboard, /leads, /pipeline, /import page shares guard + chrome.
// HOW:  requireSession() redirects visitors; AppNav holds links + logout.
// WHERE: Wraps all routes under src/app/(app)/.

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireSession();

  return (
    <div className="flex min-h-full flex-col">
      <AppNav />
      <main className="mx-auto w-[95%] max-w-[1400px] flex-1 px-2 py-4 sm:px-3 sm:py-6">{children}</main>
      <Toaster />
    </div>
  );
}
