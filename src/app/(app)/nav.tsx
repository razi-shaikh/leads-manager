"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, TableProperties, Upload, Waves } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/login/actions";

// SOT:app-nav
// WHAT: Top navigation — section links + sign out.
// WHY:  Shared chrome for all authenticated pages.
// HOW:  Active link highlighted via usePathname; logout posts to logoutAction.
// WHERE: Rendered by the (app) layout on every authed page.

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "All Leads", icon: TableProperties },
  { href: "/pipeline", label: "Pipeline", icon: Waves },
  { href: "/import", label: "Import", icon: Upload },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="border-b">
      <div className="mx-auto flex w-[95%] max-w-[1400px] items-center gap-1 overflow-x-auto p-3 sm:gap-2 sm:p-4">
        <span className="mr-2 text-sm font-semibold whitespace-nowrap sm:mr-4 sm:text-base">
          Leads Manager
        </span>
        <nav className="flex flex-1 items-center gap-1 sm:gap-2" aria-label="Primary">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Button key={href} variant={active ? "secondary" : "ghost"} size="sm" render={<Link href={href} />}>
                <Icon data-icon="inline-start" />
                {label}
              </Button>
            );
          })}
        </nav>
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut data-icon="inline-start" />
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
