# Catalogue provider validation

Date: 24 November 2026. Status: development evidence only; production selection and redistribution review pending.

The plan's Jikan discontinuation reference was checked against the [maintainer issue](https://github.com/jikan-me/jikan-rest/issues/613). The retired public Jikan host is not configured as a fallback. [Tenrai documentation](https://api.tenrai.org/documentation) is the candidate reference; automated text extraction did not expose its terms.

`scripts/probe_provider.py` made 12 sequential bounded GET requests, with at least 1.2 seconds between calls. All returned HTTP 200: anime/manga search, anime detail, two pages of a long episode list, current season, schedule, genre taxonomy, relations, anime/manga top lists and recommendations. Recorded latency was 281–938 ms for these requests. No rate-limit allowance headers were present. No deliberate 429, timeout or load test was sent to the provider.

[Sanitized results](provider-smoke.json) preserve status, shape, counts, pagination and observed headers. They contain no credentials. Temporary source responses stay in ignored `.local/`; only deliberately reduced development metadata is used by the application.

## Outstanding P0 gates

- Confirm usage, caching, artwork and synopsis redistribution rights and attribution with the source owner.
- Confirm actual quota, response-size bounds, commercial/public use, reliability and supported capabilities. A successful GET is not permission or an SLA.
- Verify null/schema drift, timeout, 429 and 5xx through contract tests using a stub; exercise supported staging behavior without forcing upstream errors.
- Verify episode identity across pages and canonical MAL identity between providers before migration.
- Select the production provider explicitly. Production fixtures are rejected by configuration.

Discovery must not be publicly released until these gates are satisfied. Publicly reachable endpoints alone do not grant redistribution rights.


## 25 November browser provider update

The owner selected AniList discovery with AniZip episode display and planned TMDB enrichment. Bounded checks of the public AniZip mapping endpoint returned 200 for AniList IDs 1 and 7054, with matching mapping keys, CORS `*` and a 900-second public cache header. ID 7054 declares 26 episodes and 2 specials but contains 31 episode-map records; entries include opening/extra keys. Do not derive completion or regular totals from the array length. Date-only release data remains date-only.

The updated AniList query for ID 7054 returned 200, no GraphQL errors, a matching ID and available banner/cover fields. No authenticated TMDB request ran. These checks establish reachability and sample shape, not complete mapping validity, usage rights or a quota entitlement. Browser adapter and error/identity tests are recorded in acceptance-record.md. Trusted episode reconciliation and TMDB remain in product/MULTI_PROVIDER_METADATA_PLAN.md.
