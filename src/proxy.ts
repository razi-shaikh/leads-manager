import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// SOT:auth-guard SOT:proxy
// WHAT: Fast-path route guard — redirects based on session cookie presence.
// WHY:  Cheap redirect before render; full signature verify lives in requireSession().
// HOW:  Matches protected pages + /login only. Never the sole auth check:
//       every Server Action and page also calls requireSession().
// WHERE: src/proxy.ts (Next.js 16 "proxy" convention; middleware.ts is deprecated).

const PROTECTED_PREFIXES = ["/dashboard", "/leads", "/pipeline", "/import"];
const SESSION_COOKIE = "lm_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/dashboard/:path*", "/leads/:path*", "/pipeline/:path*", "/import/:path*"],
};
