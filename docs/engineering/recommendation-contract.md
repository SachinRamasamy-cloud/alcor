# Recommendation scoring contract for approval

The v1 plan supplies weights but does not define individual factor scores or quality cutoffs. D-SSBP sections 6.1, 8.2 and 17.1 require resolving consequential mathematical ambiguity before implementing an interpretation. This proposal preserves all six supplied weights and adds no inferred preference or confidence percentage.

| Factor | Weight | Proposed score when evidence exists |
| --- | --- | --- |
| Genre | 30 | 1 if any explicit preferred genre matches; otherwise 0 |
| Theme | 20 | 1 if any explicit preferred theme matches; otherwise 0 |
| Similarity | 20 | 1 if a known highly rated/favorited title shares a genre or theme; otherwise 0 |
| Source quality | 15 | Source score divided by 10, only after a user-selected minimum vote count is met |
| Studio | 10 | 1 if an explicit preferred studio matches; otherwise 0 |
| Length | 5 | 1 if a known total is within the user's explicit maximum; otherwise 0 |

Missing source fields or missing user preferences remove that factor from both numerator and denominator. Score = sum(weight * available factor score) / sum(available weights). No available personal evidence means a general catalogue list, with no personalized claim. Positive-rating threshold and minimum quality votes remain explicit user choices; none is silently invented. Favorites are explicit positive evidence. Source popularity is only a deterministic tie-breaker, never a live-trending claim.

Independent example: genre matches (30), studio does not (10), source quality 8/10 (15), other factors unavailable. Expected score = (30 + 0 + 12) / 55 = 42/55. A title with missing quality uses denominator 40 rather than pretending score zero. Completed/dropped/not-interested/dismissed titles are excluded before ranking and pagination. Planned inclusion follows the saved preference. Verified franchise data can provide diversity; missing franchise coverage is declared rather than guessed.

Approval status: deferred by the owner on 25 November 2026. Do not implement this scoring proposal without a new explicit approval. This is a product heuristic, not a scientifically validated prediction or a match percentage. Release still needs engineering/editorial review. Other authorized features continue independently.
