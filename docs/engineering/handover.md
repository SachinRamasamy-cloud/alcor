# Development handover

Updated: 25 November 2026, Asia/Calcutta. Development resumed at the owner's request.

## Saved work

- Review branch: `build/alcor-v1`; remote: `SachinRamasamy-cloud/alcor`.
- Specifications, governing protocol, work orders, acceptance evidence and error log are versioned.
- Foundation and public website are in separate feature commits.
- Public development UI: responsive home, anime/manga browse, alias search, URL filters, details, source attribution, shared content/dialog/feedback and guest sign-in prompts.
- Private backend checkpoint: JWT verification, RLS migrations, library/wishlist persistence, optimistic versions, history events and Redis quotas.
- Latest verification: 17 Python tests, 3 frontend content tests, frontend lint/build. The preceding public slice passed 7 Playwright tests, including five widths and automated accessibility.

## Service and data state

The remote Supabase database was inspected read-only. No remote migrations or data writes were applied. The password was used in process memory and was not written to Git or a configuration file. The supplied administrative role bypasses RLS and must not become the API runtime identity.

Local ALCOR Docker volumes contain the initial migration and disposable integration-test records. Stopping containers preserves those volumes. Local API and owned containers are stopped for this handover.

The owner explicitly deferred Google OAuth configuration. Leave sign-in visibly unconfigured until actual browser-safe configuration is supplied; do not invent a dummy working login or use a service-role key in the frontend.

Tenrai endpoint reachability was tested, but provider selection, usage rights, artwork/synopsis redistribution and production quotas remain unresolved. The application uses an explicitly labelled finite development snapshot. Production configuration rejects fixtures.

## Next ready work

1. Read the full protocol and current source before further changes. Inspect the pushed branch and review the API checkpoint against the work orders.
2. Review the implemented account frontend and configurable PKCE flow. Add real staged OAuth and signed private browser-to-API validation when the owner enables Google. Unit/component tests cover pending-action rejection, replay deduplication, session cleanup and account-bound requests.
3. Implement P4 exact sessions/progress and its required gap/skip/rewatch/chapter tests. No episode/chapter tracking implementation exists yet.
4. Implement import preview/idempotent commit, complete export/restore and recovery. Do not fabricate dates or overwrite richer history.
5. Continue P5/P6 discovery, organization, release monitoring and notifications only after prerequisites are ready. Unsupported controls remain omitted.
6. Complete provider rights, independent engineering/security/editorial review, staging, backup/restore, performance and production operations gates before release.

## Known limits

No public production site was deployed. No release or human acceptance was claimed. The in-app browser access host was unavailable; local automated browser tests and inspected screenshots supplied the available UI evidence. Screen-reader validation and real OAuth are pending.
