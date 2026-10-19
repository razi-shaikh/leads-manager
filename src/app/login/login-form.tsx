"use client";

import { useActionState, useState } from "react";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, type LoginState } from "./actions";

// SOT:login-form
// WHAT: Login form — username + password, server-action submit.
// WHY:  Single entry point to the app for the one F3 Motor user.
// HOW:  useActionState(loginAction); errors render inline, never which field failed.
// WHERE: Rendered by /login page only.

const INITIAL_STATE: LoginState = { ok: false, error: "" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, INITIAL_STATE);
  // Controlled so values survive React's post-action form reset (failed login
  // must not wipe the username).
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="username" className="text-[15px]">
          Username
        </Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="text-base md:text-base"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="text-[15px]">
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="text-base md:text-base"
        />
      </div>
      {state.ok === false && state.error !== "" ? (
        <p role="alert" className="text-base text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        <LogIn data-icon="inline-start" />
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
