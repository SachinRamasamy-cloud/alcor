# System baseline

Date: 24 November 2026. Authority: owner request and the two supplied v1.0 specifications.

## Starting state

Remote: `https://github.com/SachinRamasamy-cloud/alcor.git`. Baseline: `12b945b`, containing only a README. No application, tests, credentials or deployment exists in the checkout. The original ZIP was read from Downloads; unchanged specifications are preserved in this repository.

## Architecture

- React, TypeScript and Vite serve a responsive public website. React Router owns routes; TanStack Query owns server state. Tailwind, accessible Radix primitives, Lucide and Motion follow the supplied monochrome design.
- FastAPI is a modular monolith. Catalogue normalization is separate from private library/tracking workflows. The frontend calls ALCOR, never a metadata provider directly.
- PostgreSQL is authoritative. Redis provides shared caches and atomic quotas. SQLAlchemy sessions set a transaction-local, verified user identity for private RLS.
- Supabase Auth supplies Google PKCE sessions. The API verifies asymmetric JWT signatures, issuer, audience, expiry and subject. No local login bypass ships in the application.
- Public catalogue content and private history have separate schemas, cache policies and lifecycles. Provider loss must not erase personal history.
- API responses use `/api/v1`, versioned OpenAPI, stable error codes, opaque cursors and explicit source/coverage metadata.

## Invariants

One user/media library entry; wishlist projects `planned`; start watching removes active wishlist membership atomically. Ever-completed evidence survives rewatching. Sparse session progress distinguishes watched/read, skipped and unresolved. Unknown totals stay null. Airing and unknown-coverage titles never auto-complete. Chapter keys are strings. All private writes enforce ownership and version checks. Metadata never supplies executable HTML.

## Dependencies and readiness

| Type | Dependency | Current evidence |
| --- | --- | --- |
| Scientific | None; tracking arithmetic follows the supplied examples | Numerical contracts defined by plan §§4.1–4.3 |
| Data | Compliant anime/manga provider, artwork/synopsis rights | Tenrai is a candidate; production selection pending |
| Development | Node, Python, Git, local PostgreSQL/Redis | Node 24.18.0, Python 3.12.10, Git 2.55.0 inspected; Docker installed but engine initially stopped |
| Runtime | Supabase, database, Redis, API, static frontend | No dedicated environment supplied |
| Verification | Unit, real PostgreSQL/Redis integration, browser QA and human review | Tests will be introduced per feature; review remains human-owned |

## Decisions

ADR-001: retain the exact stack and modular monolith selected in plan §2. No framework replacement or hosted Sites dependency is introduced. GitHub branch delivery is authorized; production deployment is gated separately by plan P0/P8 and D-SSBP §§5, 10, 17.

ADR-002: use explicit development fixtures until a production metadata provider and redistribution rights are approved. Fixtures are labelled; production configuration rejects them. The discontinued public Jikan API is not a runtime fallback.

ADR-003: use a scoped build branch for feature commits. Human review is pending; the agent does not self-certify approval or merge into the default branch.

