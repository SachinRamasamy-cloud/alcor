# Request limits

Inspected on 25 November 2026. These are the implemented limits, not proposed increases.

| Scope | Current limit | Shared allowance |
| --- | --- | --- |
| `/me/media/resolve` | 24/minute and 1/second | All accounts/processes using the same Redis store |
| Personal GET/HEAD/OPTIONS requests | 180/minute | Per authenticated account |
| Other personal requests | 60/minute | Per authenticated account, shared write bucket |
| Wishlist writes | 30/minute | The same account write bucket; not 30 additional requests |

All `/me/media/resolve` requests also consume the account write allowance because they use POST. Its global resolver guard currently runs before the stored-identity lookup, so existing associations also count. Rejected Redis checks do not consume allowance, although an earlier account check can already have admitted the request.

Implementation: `backend/app/main.py`, `backend/app/modules/catalogue/routes.py` and `backend/app/infrastructure/limits.py`. Redis uses sliding 60-second/1-second windows. The API reports the required wait in `Retry-After`; account and resolver limits are separate checks.

## Setup behavior and correction

Setup verifies selected favorite source identities before its atomic profile save. It does not require an already-completed profile. Sequential requests previously followed each successful response immediately, so a fast first lookup was followed by a second request inside the same one-second window. Running API logs showed alternating 200/429 responses.

The shared browser identity resolver now spaces request starts by 2501ms, deduplicates simultaneous same-account/title requests and honors server cooldown. It retries an identity lookup once only when 429 includes a valid Retry-After value. Further failure remains visible; there is no generic automatic replay of private writes. Setup keeps its draft and saves only after every identity resolves. Ten new favorites require at least about 22.5 seconds between the first and last request starts, plus network time; shared-provider cooldown can take longer.

The queue is per browser tab. Other tabs/accounts still share server/provider budgets, so 429s remain possible and are handled within the bounded retry. Quota thresholds and authentication/identity checks are unchanged.

## AniList's separate limit

AniList's [current rate-limit documentation](https://docs.anilist.co/guide/rate-limiting) reports a temporary 30 requests/minute limit and additional burst protection; its normal documented value is 90/minute. ALCOR uses the temporary limit as the relevant provider constraint. Direct browser browsing already spaces requests by 2100ms. Browser and backend traffic may share upstream network capacity; response cooldown headers remain authoritative. Do not confuse AniList's allowance with ALCOR's stricter resolver guard.

The separately reported HTTP 400 has no identified endpoint or response body. Only the resolver 429 has been reproduced and corrected here.
