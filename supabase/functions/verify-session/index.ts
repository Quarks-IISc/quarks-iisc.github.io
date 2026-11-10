// Supabase Edge Function: verify-session
//
// Called by the Student Hub page (assets/js/student-hub-auth.js) with
//   POST { "token": "<Microsoft ID token>" }
// Replies
//   200 { "authorized": true, "user": { name, email, tenantId } }
//   200 { "authorized": false }               token rejected
//   400 / 405 / 503                           bad request or Microsoft keys unreachable
//
// Deploy with --no-verify-jwt: the page sends a Microsoft token, not a
// Supabase one, so Supabase's built-in JWT check must be off. This function
// does the checking itself (see verify.ts).

import { verifyMicrosoftIdToken } from "./verify.ts";

const setting = (name: string, fallback: string) => Deno.env.get(name)?.trim() || fallback;
const list = (value: string) => value.split(",").map((s) => s.trim()).filter(Boolean);

const OPTIONS = {
  // Same Microsoft app as the website (_config.yml student_hub.msal_client_id).
  clientId: setting("MS_CLIENT_ID", "2b7a3439-67d5-4cb0-b8d1-a244078196e3"),
  allowedDomains: list(setting("ALLOWED_EMAIL_DOMAINS", "iisc.ac.in")),
  // Strongly recommended: IISc's Microsoft tenant ID (see README.md).
  allowedTenantIds: list(setting("ALLOWED_TENANT_IDS", "")),
};

const ALLOWED_ORIGINS = list(
  setting("ALLOWED_ORIGINS", "https://quarks.ug.iisc.ac.in,http://localhost:4000,http://127.0.0.1:4000"),
);

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  const headers: Record<string, string> = { Vary: "Origin" };
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "content-type, authorization, apikey, x-client-info";
    headers["Access-Control-Max-Age"] = "86400";
  }
  return headers;
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req);

  // Browser preflight: the page sends JSON, which triggers one.
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405, cors);

  let token: unknown;
  try {
    ({ token } = await req.json());
  } catch {
    // fall through to the check below
  }
  if (typeof token !== "string" || token.length === 0) {
    return json({ authorized: false, error: "missing token" }, 400, cors);
  }

  const result = await verifyMicrosoftIdToken(token, OPTIONS);

  if (!result.ok) {
    console.warn("verify-session rejected:", result.reason);
    if (result.retryable) return json({ authorized: false, error: "try again later" }, 503, cors);
    return json({ authorized: false }, 200, cors);
  }
  return json({ authorized: true, user: result.user }, 200, cors);
});
