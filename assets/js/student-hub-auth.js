// Student Hub sign-in: Microsoft login (MSAL) + server check (Supabase).
//
// Same approach as the course-review app:
//   1. MSAL signs the user in with their Microsoft (IISc) account in the
//      browser and gives us an ID token (a JWT signed by Microsoft).
//   2. That token is sent to a Supabase Edge Function (verify-session), which
//      checks the signature and that it's an @iisc.ac.in account. Only the
//      server's answer is trusted; anything in the browser can be faked.
//
// Settings come from _config.yml (student_hub) via window.STUDENT_HUB, which
// _layouts/default.html sets on every page.
//
// This file is loaded with import() only when needed (navbar click, hub
// page), so other pages don't download MSAL.

const config = window.STUDENT_HUB;
if (!config || !config.msalClientId || !config.verifySessionUrl) {
  throw new Error("student-hub-auth: window.STUDENT_HUB is missing (see _config.yml student_hub).");
}

// ============================================================================
// 1. MSAL — Microsoft login (runs in the browser)
// ============================================================================

// Pinned version: an unpinned URL would silently pick up breaking releases.
import { PublicClientApplication } from "https://esm.sh/@azure/msal-browser@3.27.0";

const SCOPES = ["openid", "profile", "email"];
const absolute = (path) => new URL(path, window.location.origin).href;

// MSAL CALL: create the Microsoft client.
const msal = new PublicClientApplication({
  auth: {
    clientId: config.msalClientId,
    authority: "https://login.microsoftonline.com/common",
    // Every login returns to the hub page, so this is the only URL that has
    // to be registered in the Entra app (plus its localhost twin).
    redirectUri: absolute(config.hubPath),
    // Login can start from the navbar on any page. Without this, MSAL would
    // return to that page, which never loads MSAL, and the login would be lost.
    navigateToLoginRequestUrl: false,
  },
  cache: { cacheLocation: "sessionStorage" },
});

// MSAL CALL: required before any other MSAL call.
await msal.initialize();

// MSAL CALL: finishes a login when Microsoft redirects back to the hub
// (the token arrives in the URL). Must run on every page load.
const redirectHandled = msal
  .handleRedirectPromise()
  .then((result) => {
    if (result) msal.setActiveAccount(result.account);
  })
  .catch((err) => console.error("student-hub-auth: Microsoft login failed", err));

function currentAccount() {
  return msal.getActiveAccount() ?? msal.getAllAccounts()[0] ?? null;
}

/**
 * Returns the Microsoft ID token for the signed-in user, or null if nobody
 * is signed in or the session can't be renewed without a new login.
 */
export async function getMicrosoftIdToken() {
  await redirectHandled;
  const account = currentAccount();
  if (!account) return null;
  try {
    // MSAL CALL: returns a cached token, or silently refreshes an expired one.
    const result = await msal.acquireTokenSilent({ account, scopes: SCOPES });
    msal.setActiveAccount(result.account);
    return result.idToken;
  } catch (err) {
    console.warn("student-hub-auth: Microsoft session expired", err);
    return null;
  }
}

/** Sends the user to Microsoft's login page; they come back to the hub. */
export async function startMicrosoftLogin() {
  await redirectHandled;
  // MSAL CALL: full-page redirect to login.microsoftonline.com.
  // select_account lets someone who picked the wrong account choose again.
  await msal.loginRedirect({ scopes: SCOPES, prompt: "select_account" });
}

/**
 * Forgets the Microsoft session in this browser tab only. It does not sign
 * the user out of Outlook/Teams: returning false from onRedirectNavigate
 * clears MSAL's cache without visiting Microsoft's logout page.
 */
export async function signOut() {
  await redirectHandled;
  // MSAL CALL: clear the local session.
  await msal.logoutRedirect({
    account: currentAccount() ?? undefined,
    onRedirectNavigate: () => false,
  });
}

// ============================================================================
// 2. Supabase — server-side check of the Microsoft token
// ============================================================================

/**
 * Asks the verify-session Edge Function whether this token belongs to an
 * IISc student. Resolves to { authorized: true, user } or
 * { authorized: false }. Throws if Supabase can't be reached, so callers can
 * tell "rejected" apart from "server down".
 */
export async function verifyWithSupabase(idToken) {
  // SUPABASE CALL: POST the Microsoft token to the Edge Function.
  const response = await fetch(config.verifySessionUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: idToken }),
  });
  if (!response.ok) {
    throw new Error(`verify-session returned HTTP ${response.status}`);
  }
  const data = await response.json();
  return data.authorized ? { authorized: true, user: data.user } : { authorized: false };
}
