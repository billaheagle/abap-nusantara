import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth/session";

const SESSION_COOKIE = "abap_admin_session";

/**
 * Authorization boundary for the admin area. Runs before any admin page or
 * admin API route executes, so a missing/expired/tampered session cookie
 * never reaches that code. Page- and action-level checks (getAdminSession)
 * remain as defense-in-depth — this is not the only gate.
 *
 * Renamed from `middleware` per Next.js 16, where the `middleware` file
 * convention is deprecated in favour of `proxy` (which defaults to the
 * Node.js runtime).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  // An already-authenticated admin has no reason to see the login form —
  // send them straight to the dashboard.
  if (pathname === "/admin/login") {
    const session = await verifySessionToken(token);
    return session
      ? NextResponse.redirect(new URL("/admin/dashboard", request.url))
      : NextResponse.next();
  }

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (isAdminPage || isAdminApi) {
    const session = await verifySessionToken(token);
    if (!session) {
      if (isAdminApi) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
