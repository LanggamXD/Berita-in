import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE } from "@/lib/auth";

/** Prefixes that are always allowed publicly */
const PUBLIC_PREFIXES = ["/_next", "/favicon.ico"];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // 1. Allow static assets and Next.js internals
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return NextResponse.next();
    }
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const isAuthenticated = verifyToken(token);

  // 2. Allow public login routes
  if (pathname === "/login" || pathname === "/api/auth/login") {
    // If already authenticated and visiting /login, redirect to /
    if (pathname === "/login" && isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // 3. Protect all other routes
  if (!isAuthenticated) {
    // API routes -> 401 Unauthorized JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Page routes -> redirect to /login
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
