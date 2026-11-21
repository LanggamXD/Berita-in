import { NextRequest, NextResponse } from "next/server";
import { createToken, AUTH_COOKIE, TOKEN_MAX_AGE_SECONDS } from "@/lib/auth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: { password?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const password = (body?.password || "").trim();
  const expected = (process.env.APP_PASSWORD || "").trim();

  if (!expected) {
    console.error("[Login API] APP_PASSWORD environment variable is not configured.");
    return NextResponse.json(
      { error: "Server auth env variables not configured" },
      { status: 500 }
    );
  }

  if (!password || password !== expected) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = createToken();
  const response = NextResponse.json({ ok: true, success: true }, { status: 200 });

  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE_SECONDS, // 30 days = 2,592,000 seconds
    secure: process.env.VERCEL === "1",
  });

  return response;
}
