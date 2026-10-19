import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

// SOT:login-page
// WHAT: Public /login page — redirects to /dashboard when already signed in.
// WHY:  Single-user gate; proxy.ts also redirects authed users away from here.
// HOW:  Server component; form is the client LoginForm.
// WHERE: Entry point for unauthenticated visitors.

export const instant = false;

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Leads Manager</CardTitle>
          <CardDescription>Sign in to manage F3 Motor bike-purchase leads.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
