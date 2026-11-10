// Verifies a Microsoft Entra ID token (a JWT) using only Web Crypto, so it
// runs on Supabase Edge Functions (Deno) without extra packages.
//
// A token is accepted only if ALL of these hold:
//   - signed with RS256 by one of Microsoft's published keys (JWKS)
//   - aud  == our app's client ID (a token minted for another app is rejected)
//   - iss  == https://login.microsoftonline.com/<tid>/v2.0
//   - not expired (exp) and already valid (nbf), with 60 s clock slack
//   - tid  is an allowed tenant, when a tenant list is configured
//   - preferred_username ends in an allowed domain (e.g. @iisc.ac.in)

export interface VerifyOptions {
  clientId: string;
  allowedDomains: string[];
  /** Microsoft tenant IDs to accept. Empty = accept any tenant (domain check only). */
  allowedTenantIds: string[];
  jwksUrl?: string;
  /** Seconds since epoch; tests override it. */
  now?: () => number;
}

export interface VerifiedUser {
  name: string;
  email: string;
  tenantId: string;
}

export type VerifyResult =
  | { ok: true; user: VerifiedUser }
  | { ok: false; reason: string; retryable?: boolean };

const DEFAULT_JWKS_URL = "https://login.microsoftonline.com/common/discovery/v2.0/keys";
const CLOCK_SKEW_SECONDS = 60;
const JWKS_MAX_AGE_MS = 60 * 60 * 1000;

interface Jwk {
  kid: string;
  kty: string;
  n: string;
  e: string;
}

let jwksCache: { url: string; keys: Jwk[]; fetchedAt: number } | null = null;

/** Test helper: forget cached Microsoft keys. */
export function clearJwksCache() {
  jwksCache = null;
}

async function fetchKeys(url: string, force: boolean): Promise<Jwk[]> {
  const fresh = jwksCache && jwksCache.url === url && Date.now() - jwksCache.fetchedAt < JWKS_MAX_AGE_MS;
  if (fresh && !force) return jwksCache!.keys;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`JWKS HTTP ${res.status}`);
  const body = await res.json();
  jwksCache = { url, keys: body.keys ?? [], fetchedAt: Date.now() };
  return jwksCache.keys;
}

function base64UrlToBytes(input: string): Uint8Array {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeJson(segment: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(segment)));
}

export async function verifyMicrosoftIdToken(token: string, options: VerifyOptions): Promise<VerifyResult> {
  const jwksUrl = options.jwksUrl ?? DEFAULT_JWKS_URL;
  const now = options.now ? options.now() : Math.floor(Date.now() / 1000);

  // --- 1. Shape and header ---------------------------------------------------
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed token" };

  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;
  try {
    header = decodeJson(parts[0]);
    payload = decodeJson(parts[1]);
  } catch {
    return { ok: false, reason: "malformed token" };
  }
  // Only RS256: refuses "none" and HMAC algorithm-confusion tricks.
  if (header.alg !== "RS256") return { ok: false, reason: `unsupported alg ${header.alg}` };
  if (typeof header.kid !== "string") return { ok: false, reason: "missing kid" };

  // --- 2. Signature against Microsoft's public keys -------------------------
  let jwk: Jwk | undefined;
  try {
    jwk = (await fetchKeys(jwksUrl, false)).find((k) => k.kid === header.kid);
    // Microsoft rotates keys; refetch once before giving up.
    if (!jwk) jwk = (await fetchKeys(jwksUrl, true)).find((k) => k.kid === header.kid);
  } catch (err) {
    return { ok: false, reason: `could not load Microsoft keys: ${err}`, retryable: true };
  }
  if (!jwk || jwk.kty !== "RSA") return { ok: false, reason: "unknown signing key" };

  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: "RSA", n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const signedData = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const signatureOk = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, base64UrlToBytes(parts[2]), signedData);
  if (!signatureOk) return { ok: false, reason: "bad signature" };

  // --- 3. Claims ---------------------------------------------------------------
  if (payload.aud !== options.clientId) return { ok: false, reason: "wrong audience" };

  const tid = payload.tid;
  if (typeof tid !== "string") return { ok: false, reason: "missing tid" };
  if (payload.iss !== `https://login.microsoftonline.com/${tid}/v2.0`) return { ok: false, reason: "wrong issuer" };

  if (typeof payload.exp !== "number" || payload.exp + CLOCK_SKEW_SECONDS < now) {
    return { ok: false, reason: "expired" };
  }
  if (typeof payload.nbf === "number" && payload.nbf - CLOCK_SKEW_SECONDS > now) {
    return { ok: false, reason: "not yet valid" };
  }

  if (options.allowedTenantIds.length > 0 && !options.allowedTenantIds.includes(tid)) {
    return { ok: false, reason: "tenant not allowed" };
  }

  const email = typeof payload.preferred_username === "string" ? payload.preferred_username.toLowerCase() : "";
  const domainOk = options.allowedDomains.some((d) => email.endsWith("@" + d.toLowerCase()));
  if (!domainOk) return { ok: false, reason: "email domain not allowed" };

  return {
    ok: true,
    user: { name: typeof payload.name === "string" ? payload.name : email, email, tenantId: tid },
  };
}
