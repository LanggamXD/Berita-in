/**
 * Auth utilities using the Web Crypto API (HMAC-SHA256).
 * Works in both Node.js and Edge runtimes without external dependencies.
 */

const COOKIE_NAME = "beritain_session";
const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/** Encodes a string to a Uint8Array<ArrayBuffer> for use with SubtleCrypto */
function encode(str: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(str) as Uint8Array<ArrayBuffer>;
}

/** Converts an ArrayBuffer to a hex string */
function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Imports the AUTH_SECRET as an HMAC-SHA256 CryptoKey */
async function getKey(): Promise<CryptoKey> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not set.");
  }
  return crypto.subtle.importKey(
    "raw",
    encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/** Creates a signed session token with an expiry timestamp embedded */
export async function createToken(): Promise<string> {
  const key = await getKey();
  const expiresAt = Date.now() + TOKEN_MAX_AGE_SECONDS * 1000;
  const payload = String(expiresAt);
  const signature = await crypto.subtle.sign("HMAC", key, encode(payload));
  const sigHex = bufToHex(signature);
  // token = "<expiresAt>.<sigHex>"
  return `${payload}.${sigHex}`;
}

/** Verifies the token and returns true if valid and not expired */
export async function verifyToken(token: string): Promise<boolean> {
  try {
    const dotIndex = token.lastIndexOf(".");
    if (dotIndex === -1) return false;

    const payload = token.slice(0, dotIndex);
    const sigHex = token.slice(dotIndex + 1);

    const expiresAt = Number(payload);
    if (isNaN(expiresAt) || Date.now() > expiresAt) return false;

    // Reconstruct the expected signature bytes from hex
    const matches = sigHex.match(/.{2}/g);
    if (!matches) return false;
    const sigBuffer = new Uint8Array(matches.map((h) => parseInt(h, 16)));
    // Cast to satisfy SubtleCrypto's strict BufferSource requirement
    const sigBytes = sigBuffer.buffer as ArrayBuffer;

    const key = await getKey();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      encode(payload)
    );

    return valid;
  } catch {
    return false;
  }
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Returns true if a === b.
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do a dummy comparison to avoid timing leaks based on length
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= a.charCodeAt(i) ^ (b.charCodeAt(i % b.length) || 0);
    }
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export { COOKIE_NAME, TOKEN_MAX_AGE_SECONDS };
