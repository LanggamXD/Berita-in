import { NextRequest, NextResponse } from "next/server";
import {
  constantTimeEqual,
  createToken,
  COOKIE_NAME,
  TOKEN_MAX_AGE_SECONDS,
} from "@/lib/auth";

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: { password?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { password } = body;
  const appPassword = process.env.APP_PASSWORD;

  if (!appPassword) {
    console.error("APP_PASSWORD environment variable is not set.");
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 }
    );
  }

  if (!password || !constantTimeEqual(password, appPassword)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = await createToken();

  const isProduction = process.env.NODE_ENV === "production";

  const response = NextResponse.json({ success: true }, { status: 200 });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: TOKEN_MAX_AGE_SECONDS,
    path: "/",
  });

  return response;
}
