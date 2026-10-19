import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";

// SOT:root-page
// WHAT: Root route — sends visitors to /login and users to /dashboard.
// WHY:  No public landing page in MVP; the app starts behind auth.
// HOW:  Server-side session check; no UI rendered.
// WHERE: /

export const instant = false;

export default async function Home() {
  const session = await getSession();
  redirect(session ? "/dashboard" : "/login");
}
