# TomatoSky

Public brand homepage and employee portal for TOMATO SKY SAL, Lebanon. VirginValley and Black Beauty Tomato are brands under one company.

## Run

Use Node.js 22 or newer. Run `npm install`, copy `.env.example` to `.env.local` and fill in your public project configuration, then `npm run dev`. Next.js Fast Refresh updates most source edits without restarting.

The current workspace already has `.env.local` configured; it is ignored by Git.

- `/`: public homepage.
- `/login`: employee password sign-in. No registration form.
- `/auth/mfa`: approved employees enroll or verify an authenticator.
- `/auth/forgot-password`: request password recovery through the configured email sender.
- `/auth/confirm`: verify a recovery email after explicit confirmation; supports another browser.
- `/auth/callback`: accept default-template recovery sessions across browsers, or legacy PKCE codes in their original browser.
- `/auth/recovery-error`: explain a failed legacy link without returning to the email form.
- `/auth/update-password`: approved employees choose a new password; existing MFA remains enforced.
- `/portal`: requires verified Supabase identity, active admin membership, and MFA in all environments. Brand records load under RLS.

## Initial Supabase setup

Follow [docs/supabase-setup.md](docs/supabase-setup.md). Run the migration in Supabase, disable public signup, create your first Auth user, and approve that user with the separate bootstrap script.

The publishable key cannot perform these administrative setup steps. The portal fails closed until they are complete.

## Verify

- `npm run build`
- `npm run test:access`
- `npm run check:supabase`
- `npm run test:recovery`

## Current scope

Next.js App Router, React, TypeScript, Motion, Lucide, Supabase SSR/Auth, and PostgreSQL. Shared responsive CSS provides the initial design. The public pages and portal are separate route/component surfaces in one application for now. Separate deployments can be introduced later. Hosting target remains Vercel, with the domain on Cloudflare; nothing has been published.

Implemented: password login and email recovery, authenticator setup/challenge, server-validated identity, approved employee list, database access rules, current-session logout, and brand reads. No admin/service-role key is used by the app. App code does not log passwords or session tokens; callback URLs contain temporary codes, so production access logging must redact their query parameters.

Pending: successful real-account login/recovery testing and confirming Site URL/allowed callback configuration, email invitations, in-app employee administration, inventory, document uploads, reports, and production rollout. The default reset-email template is supported without edits; `supabase/templates/reset-password.html` is optional after configuring custom SMTP. The live schema has been applied and signup disabled. Lost-authenticator recovery goes through a trusted administrator.

The homepage image is AI-generated illustrative produce photography. Brand treatments and activity copy are proposals for company review. Fonts use Google Fonts with system fallbacks; self-hosting can be done before launch.
