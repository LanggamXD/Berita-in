import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

/** Routes that are publicly accessible without authentication */
const PUBLIC_ROUTES = new Set(["/login", "/api/auth/login"]);

/** Prefixes that are always allowed (Next.js internals, static assets) */
const PUBLIC_PREFIXES = ["/_next/", "/favicon.ico"];

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Always allow Next.js internals and static assets
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return NextResponse.next();
    }
  }

  // Allow explicitly public routes
  if (PUBLIC_ROUTES.has(pathname)) {
    // If already authenticated, redirect away from /login → /
    if (pathname === "/login") {
      const token = request.cookies.get(COOKIE_NAME)?.value;
      if (token && (await verifyToken(token))) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    return NextResponse.next();
  }

  // All other routes require authentication
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const isAuthenticated = token ? await verifyToken(token) : false;

  if (!isAuthenticated) {
    // API routes → 401 JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    // Page routes → redirect to /login
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Match everything except:
   * - Next.js static files served from _next/static
   * - Next.js image optimization at _next/image
   * - favicon.ico
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
