/**
 * Pure Deterministic Stateless Auth Utilities
 *
 * Uses btoa/atob with APP_PASSWORD + AUTH_SECRET and embedded 30-day expiration.
 * Zero external dependencies, runs identically across Node.js, Edge, and browser.
 */

export const AUTH_COOKIE = "beritain_auth";
export const AUTH_COOKIE_NAME = AUTH_COOKIE; // alias
export const COOKIE_NAME = AUTH_COOKIE;      // alias
export const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days (2,592,000s)

/**
 * Creates a deterministic, stateless token containing:
 * "<expiresAtMs>:<APP_PASSWORD>:<AUTH_SECRET>" encoded via btoa
 */
export function createToken(): string {
  const expiresAt = Date.now() + TOKEN_MAX_AGE_SECONDS * 1000;
  const pass = (process.env.APP_PASSWORD || "").trim();
  const secret = (process.env.AUTH_SECRET || "").trim();
  return btoa(`${expiresAt}:${pass}:${secret}`);
}

export const createSessionToken = createToken;

/**
 * Validates the token statelessly:
 * 1. Decodes base64 string
 * 2. Checks that expiresAtMs > Date.now()
 * 3. Compares embedded password and secret against server environment
 */
export function verifyToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== "string") return false;

  try {
    const decoded = atob(token);
    const parts = decoded.split(":");
    if (parts.length < 3) return false;

    const expiresAt = Number(parts[0]);
    if (!expiresAt || isNaN(expiresAt) || Date.now() > expiresAt) {
      return false;
    }

    const pass = parts[1];
    const secret = parts.slice(2).join(":"); // handles secrets containing colons

    const expectedPass = (process.env.APP_PASSWORD || "").trim();
    const expectedSecret = (process.env.AUTH_SECRET || "").trim();

    if (!expectedPass) return false;

    return pass === expectedPass && (!expectedSecret || secret === expectedSecret);
  } catch {
    return false;
  }
}

export const verifySessionToken = verifyToken;
