# Accounts, profile setup and dashboard

Owner request, 25 November 2026. Source: the supplied Personal Intelligence Profile attachment and the explicit limit of three steps and no more than ten questions.

## First implementation

Use the existing Supabase project for email/password registration, email confirmation, login and password recovery. Keep Google as an optional configured provider and remove its setup-warning paragraph. Passwords stay in form memory and go only to Supabase; ALCOR stores no password. Missing real configuration produces an honest contextual error, never a dummy account. The owner will configure the browser-safe key later.

Profile setup has nine optional questions. It can be skipped and edited later:

| Step | Questions |
| --- | --- |
| 1. Your background | Display name; year you started watching; media types you enjoy |
| 2. Your taste | Favorite anime; preferred genres; story qualities you enjoy |
| 3. Make it fit | Genres you dislike or strictly exclude; completed/ongoing preference; optional maximum anime episode count |

Watching-start year is separate from title release year. Favorite titles do not mark anything watched, completed or added to a library. Favorites use verified catalogue identities. Soft dislikes and strict genre exclusions remain separate; strict exclusions take precedence over likes. Optional unanswered values stay unknown.

Reuse versioned, account-owned profile/preferences storage. Extend the preferences JSON with a versioned intelligence profile; verify referenced favorite identities without trusting browser-supplied metadata. No new database table or remote migration is needed. Preserve existing preference values and optimistic concurrency.

## Useful dashboard

Add a signed-in dashboard with a setup prompt, continue watching/reading, favorites and a "You may like" shelf based on explicit saved filters. Explain the actual basis of each shelf. Apply known hard exclusions and personal history before showing suggestions. Public browsing stays available without the personal server. No explicit preferences means a clearly general discovery shelf.

Do not implement the deferred weighted scoring proposal, inferred match percentages, learned preference vectors, information-gain selection or historical reconstruction. Story-quality answers are explicit preferences, not evidence that every title has reliable narrative metadata. The proposed intelligence engines and APEA remain future research work.

## Verification and release

Verify real local PostgreSQL ownership/concurrency and safe favorite references, generated contracts, SDK-mocked email/confirmation/recovery flows, account cache clearing, setup steps/skip/edit, actual filter behavior and mobile accessibility. Live authentication, email delivery, independent security review and release require the owner's actual configuration and acceptance.
