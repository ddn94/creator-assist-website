# Supabase setup (main and staging)

Auth uses the Supabase client (`@supabase/supabase-js` and `@supabase/ssr`). There is no Prisma schema. Run the SQL yourself in each Supabase project.

Create **two projects**. They do not share data.

| Environment | Supabase project | Where the app reads env vars |
| --- | --- | --- |
| Local | Staging project | `creator-assist-new/.env.local` |
| Staging | Staging project | Host env for the staging deploy |
| Main | Production project | Host env for the production deploy |

Use the same variable **names** in all three places. Only the **values** change.

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

The publishable key is public. It is safe in `NEXT_PUBLIC_*` because row-level security limits what it can do. Do not put the secret key in the app or in a `NEXT_PUBLIC_` variable.

## 1. Create the projects

In the [Supabase dashboard](https://supabase.com/dashboard):

1. Create a project for staging, for example `creator-assist-staging`.
2. Create a project for main, for example `creator-assist`.
3. In each project, open **Project Settings → API** and copy the project URL and the publishable key.

## 2. Run the SQL in both projects

For **each** project:

1. Open **SQL Editor → New query**.
2. Paste the full file `supabase/migrations/20260923120000_auth.sql`.
3. Run it once.

That creates:

- `waitlist` — email plus a unique invite code
- `profiles` — app user row (role, name, photo, flexible onboarding jsonb). Not `auth.users`
- `talent_records` — agency roster rows. A record is not an account. An invite adds a unique code. Signup links the account and marks the row active
- `avatars` storage bucket
- the trigger that creates a profile only when the invite code matches

## 3. Auth settings in both projects

**Authentication → Providers → Email**

- Email provider on
- For local testing you can turn **Confirm email** off. If you leave it on, signup tells the person to confirm, then they sign in. The invite is consumed when the account is created.

**Authentication → URL configuration**

Set these separately per project.

Staging project:

- Site URL: your staging origin, for example `https://staging.yourdomain.com`
- Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://staging.yourdomain.com/auth/callback`

Main project:

- Site URL: your production origin, for example `https://yourdomain.com`
- Redirect URLs:
  - `https://yourdomain.com/auth/callback`
  - Add a preview URL only if production builds are opened somewhere else

Password reset and email confirmation both return to `/auth/callback`.

## 4. Local env

From `creator-assist-new`:

```bash
cp supabase/env.example .env.local
```

Point `.env.local` at the **staging** project URL and publishable key. Restart `npm run dev`.

`.env*` is gitignored, so `.env.local` stays on your machine.

## 5. Staging and main on the host

If you deploy with Vercel, open the project → **Settings → Environment Variables**.

Add both variables twice:

- **Preview** (or a custom Staging environment, if the staging branch uses one): staging project URL and publishable key
- **Production**: main project URL and publishable key

Assign Production to the `main` branch. Point Preview, or the staging branch, at the staging Supabase project.

If the host is not Vercel, set the same two variables in that host’s staging environment and production environment. Do not share one `.env` file between them.

Redeploy after saving the variables. `NEXT_PUBLIC_` values are baked in at build time, so a running deploy will not pick them up until the next build.

## 6. Check the flow

1. Open `/`, enter an email, and join the waitlist.
2. In the **staging** project, open **Table Editor → waitlist**. Copy `invite_code` for that email. You send this email yourself. The app does not send it.
3. Sign up at `/signup/talent` or `/signup/agency` with that email and code.
4. Finish onboarding. The answers are stored on `profiles.onboarding`. Name, country, and agency name are also copied onto columns.
5. Open **Profile**, upload a photo, then change it.
6. Sign out and sign in.
7. As an agency, add a talent record, then **Save and send invite**. The talent detail page shows the code. They sign up on the talent form with that email and code.

Repeat steps 2–3 against the **main** project only when you are ready for real users. Waitlist rows in staging are not in main.

## Onboarding questions

`profiles.onboarding` is jsonb. Current keys are `name`, `ageBracket`, `country`, `platforms`, `agencyName`, and `rosterSize`.

To add a question, add the field to the onboarding or profile form and include its key in the object passed to `saveProfileAnswers`. To remove one, stop writing that key. Existing answers can stay. Do not put these fields on `auth.users`.
