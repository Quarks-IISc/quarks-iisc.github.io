# verify-session (Supabase Edge Function)

Checks the Microsoft ID token that the Student Hub page sends, so only signed-in
IISc accounts get in. The website calls it from `assets/js/student-hub-auth.js`
(`verifyWithSupabase`).

## Deploy

Needs the [Supabase CLI](https://supabase.com/docs/guides/cli) and access to the
Supabase project (`hojlmrrgkqvchqyggmbb`, shared with course-review).

```bash
supabase login
supabase link --project-ref hojlmrrgkqvchqyggmbb
supabase functions deploy verify-session --no-verify-jwt
```

`--no-verify-jwt` is required: the page sends a Microsoft token, not a Supabase
one, so Supabase's own check would reject every request. This function verifies
the Microsoft token itself (`verify.ts`).

## Settings (optional secrets)

| Secret | Default | Purpose |
|---|---|---|
| `MS_CLIENT_ID` | course-review's app ID | Must match `student_hub.msal_client_id` in `_config.yml` |
| `ALLOWED_EMAIL_DOMAINS` | `iisc.ac.in` | Comma-separated |
| `ALLOWED_TENANT_IDS` | *(empty: domain check only)* | IISc's Microsoft tenant ID. **Recommended** |
| `ALLOWED_ORIGINS` | Quarks site + localhost:4000 | Sites allowed to call the function (CORS) |

Set one with e.g. `supabase secrets set ALLOWED_TENANT_IDS=<id>`.

**Finding IISc's tenant ID:** open
`https://login.microsoftonline.com/iisc.ac.in/v2.0/.well-known/openid-configuration`
in a browser. The long ID inside `"issuer"` is the tenant ID. Microsoft advises
against authorizing on the email/username claim alone, so set this.

## Test

```bash
curl -i -X POST https://hojlmrrgkqvchqyggmbb.supabase.co/functions/v1/verify-session \
  -H "Content-Type: application/json" -d '{"token":"not-a-real-token"}'
# -> 200 {"authorized":false}
```
