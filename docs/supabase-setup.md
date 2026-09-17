# Connect the development portal

Project: `yjsxpjoqyfstoeddzfkz`. The supplied URL and publishable key are saved in ignored `.env.local`. No service-role key or database password is needed in the app.

## 1. Apply the schema

In the project's **SQL Editor**, create a new query, paste the complete contents of `supabase/migrations/202609160001_portal_foundation.sql`, and run it once.

This creates the approved employee list and two brand records, enables row-level security, removes anonymous grants, and requires MFA for brand access. It does not modify existing authentication users. Do not repeatedly run the migration; subsequent changes will use new migration files.

## 2. Configure authentication

In **Authentication → Sign In / Providers** (or the corresponding user signup settings):

- Disable **Allow new users to sign up**.
- Keep email/password authentication enabled.
- Disable anonymous sign-in; do not enable social providers for this first slice.
- Keep email confirmation enabled for future invitations.

In **Authentication → Multi-Factor**, enable authenticator/TOTP enrollment and verification if disabled. The app requires a verified authenticator before admitting an employee.

In **Authentication → URL Configuration**, use `http://127.0.0.1:3000` as the development Site URL (without a trailing slash) and add `http://127.0.0.1:3000/auth/callback` to the allowed Redirect URLs. This must be allowed or Supabase may send the user to the homepage instead.

Leave the default Reset Password email template unchanged. New free projects using Supabase's built-in sender cannot edit templates without custom SMTP. The app requests recovery using an isolated, non-persistent implicit-flow client. The default email verifies with Supabase and redirects to `/auth/callback` with the recovery session in the URL fragment. The callback removes credentials from the address bar, holds them in memory, and establishes the shared cookie session after **Continue to new password**. The password page independently verifies identity, active membership, and any existing MFA. This request client never replaces the app's normal SSR client.

Request a fresh email after the app update and any cooldown. Earlier PKCE emails still require their original browser and may already be invalid. New emails support opening in another browser. During local development, open the link on the computer running the server: `127.0.0.1` on a phone refers to the phone, not the development computer. Keep the server running. Complete the confirmation without reloading because credentials are held only in memory. If a consumed link cannot be reopened, request a new one after the cooldown.

Optional after custom SMTP is configured: apply `supabase/templates/reset-password.html` for the `/auth/confirm` token-hash flow. That flow only consumes the link after the confirmation button; default Supabase links are consumed when the email link is followed, so email scanners can invalidate them. Disable email click tracking when configuring a custom sender so links are preserved.

If requests are rate limited, stop retrying until the applicable limit resets. Supabase's built-in sender defaults to two emails per hour per project, in addition to per-user recovery cooldowns. The app cannot reset that quota. A custom SMTP sender is needed for practical production email delivery. Do not request additional emails merely to test the UI.

Supabase's default sender only sends to addresses belonging to the Supabase project organization team. If your employee's address is not one of them, configure a custom SMTP provider in Supabase; do not add employees to the Supabase management team solely to enable email delivery. Production needs a configured sender and verified sender domain. Provider credentials belong in Supabase settings, never browser configuration.

## 3. Create your first administrator

In **Authentication → Users → Add user → Create new user**, create YOUR account using your own work email and a strong password chosen privately. Auto-confirm your own email for this initial development account. Never share your password in chat or put it into a SQL file.

Open `supabase/enable-first-admin.sql`, replace `REPLACE_WITH_YOUR_EMAIL` and `REPLACE_WITH_YOUR_NAME`, then run it in the SQL Editor. The script refuses unchanged placeholders and requires an existing authentication user. It enables only that account.

Creating an Auth account alone does not give portal access. New employees must be deliberately approved in `portal_members`. No user can grant themselves access or edit their membership through the app or Data API, regardless of their user metadata.

## 4. Sign in and enroll MFA

Open `http://127.0.0.1:3000/login`. Sign in, choose **Set up authenticator**, scan the QR code with an authenticator app, and enter the six-digit code. The portal then loads the real brand records from Supabase. Inventory, document uploads, and reports remain future modules.

If setup fails, the app denies access. The unauthenticated design-preview route no longer exists.

## Recovery and offboarding

Employees can request email recovery at `/auth/forgot-password`. The default email opens `/auth/callback`; the optional custom template opens `/auth/confirm`. Both use the same confirmation form, accept only supported link formats, and establish a Supabase-verified session before opening `/auth/update-password`. Previously issued PKCE links remain supported in their original browser. Failed links show an explanation rather than returning to the email form. Both the password page and the mutation require an approved employee. Existing verified MFA factors must be challenged before a password update; the mutation independently checks this. Successful updates request global sign-out, then offer a fresh sign-in. Existing access tokens may remain valid until their expiry, so use membership deactivation for immediate operational access revocation.

There is no app-based MFA reset bypass. Trusted administrators handle lost-authenticator recovery after verifying the employee's identity. Before inviting other employees, test real email delivery, expired links, password updates, and the recovery/support procedure.

To revoke portal access, set `portal_members.active` to `false` using the trusted SQL Editor, then revoke the user's sessions/disable the Auth account as appropriate. Membership is rechecked on each protected server request and database read. Previously displayed information cannot be removed from someone's memory or screenshots.

## Verification

- `npm run build`: production compilation and TypeScript.
- `npm run test:access`: local PostgreSQL tests of the actual migration's grants and RLS.
- `npm run check:supabase`: read-only live connection/settings check; prints no credentials.
- `npm run test:recovery`: link parsing, explicit confirmation, cross-browser verification, error handling, mutation authorization, MFA, validation, and partial-failure tests against the real code with mocked Auth transport. Does not send email or change any real account.
- Before production, test real approved, inactive, and unapproved development accounts: login, MFA setup/challenge, reload, logout, and direct portal requests. Positive end-to-end authentication cannot be verified until an account and the schema exist.

The live schema/settings must be applied through your dashboard or a separately authorized management connection. The publishable key intentionally cannot perform these operations.

## Deployment later

Keep development separate from production. In Vercel, set the public configuration values for the intended Supabase project, configure the real portal URL, and apply reviewed migrations to the production project. Never expose service-role or secret keys in browser variables. Every future private table needs RLS and explicit grants; every server mutation needs `requireEmployee()` and its own validation.

### Public site and portal on separate hosts

The public marketing site and the employee portal are one application, split by hostname at the edge in `src/proxy.ts`. The apex domain serves only the public site; the portal lives on a subdomain.

1. **DNS (Cloudflare):** point both the apex (e.g. `tomatosky.com`) and the portal subdomain (e.g. `portal.tomatosky.com`) at the same Vercel project. Add both domains in the Vercel project's **Domains** settings.
2. **Environment variables (Vercel, production):**
   - `SITE_HOST=tomatosky.com` — the public host (server-only, not `NEXT_PUBLIC`).
   - `PORTAL_HOST=portal.tomatosky.com` — the portal host (server-only).
   - `NEXT_PUBLIC_SITE_URL=https://portal.tomatosky.com` — the portal origin, used by the recovery flow's origin guard and reset-link `redirectTo`.
   - The usual `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. **Behavior when both hosts are set:** the apex refuses `/portal`, `/login`, and `/auth/*` (redirecting them to the portal host), and the portal host redirects anything that is not a portal route to `/login`. Leaving `SITE_HOST`/`PORTAL_HOST` unset (as in local development) serves everything from one origin, unchanged.
4. **Supabase URL configuration:** set the Site URL to `https://portal.tomatosky.com` and add `https://portal.tomatosky.com/auth/callback` to the allowed Redirect URLs, mirroring the local `127.0.0.1:3000` values.

If you later want stronger isolation (the public deployment not even containing portal code), promote this to two separate Vercel deployments from the same repo; the host split above is the single-deployment step toward that.

## Folders and the Administration console

Two later migrations extend the portal. Apply each once in the SQL Editor, in order:

1. `supabase/migrations/202609170001_portal_folders.sql` — employee-managed folders for the Inventory, Documents, and Reports modules (full RLS: approved MFA employees only).
2. `supabase/migrations/202609170002_roles_and_admin.sql` — adds a `staff` role alongside `admin`. Both roles can use the portal; **Administration is admin-only**, enforced in the app. Also grants the `service_role` (admin key) the table access the foundation migration's broad `REVOKE` had removed.
3. `supabase/migrations/202609170003_inventory.sql` — Inventory v1: products (per brand), stock locations, and stock movements with a running-total on-hand view. Approved MFA employees (admin or staff) manage all of it.

The **Administration console** (invite employees, activate/deactivate, change roles) needs the Supabase **service-role key**, since creating Auth accounts and reading the full roster are privileged operations:

- Set `SUPABASE_SERVICE_ROLE_KEY` as a **server-only** secret in Vercel (Production) and in local `.env.local`. Never prefix it with `NEXT_PUBLIC_`, and never expose it to the browser. It is used only inside `requireAdmin()`-gated server actions.
- Employee invitations send a set-password email through the configured SMTP sender (custom SMTP, e.g. Resend, must be set up first). New employees set a password and enroll an authenticator on first sign-in.
- Safeguards: an admin cannot deactivate or demote their own account, and the last active admin cannot be removed.

Custom SMTP: configure a real sender (e.g. Resend on a `send.` subdomain) under Authentication → Emails, so recovery and invitation emails deliver reliably. The default Supabase sender is rate-limited and only reaches project-team addresses.

References: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [MFA](https://supabase.com/docs/guides/auth/auth-mfa/totp).
