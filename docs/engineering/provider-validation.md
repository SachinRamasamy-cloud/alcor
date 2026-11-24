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
