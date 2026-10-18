# SEC-01 — Auth proxy handoff verification

## Resolution in application code

- Added `src/lib/server/trusted-proxy.ts`: production auth requires `TRUSTED_PROXY_SECRET` of at least 32 characters and a matching `x-warrantyidea-proxy-secret`. Proof uses SHA-256 fixed-length digests and `timingSafeEqual`; errors contain no proof/configuration values.
- Only authenticated proxy `X-Real-IP` is accepted, validated with `node:net.isIP`; IPv6 is canonicalized. Missing/invalid proof, missing/invalid IP, lists, ports and zone identifiers fail closed with sanitized HTTP 503 / `AUTH_PROXY_UNAVAILABLE`, `Cache-Control: no-store`, before calling Better Auth.
- Incoming `x-warrantyidea-client-ip` is removed and replaced. Proxy proof and external forwarding/IP headers are stripped before the library. Better Auth trusts only the internally set `x-warrantyidea-client-ip`.
- Existing Origin checks, strict registration/sign-in schemas, native session responses/cookies and no-store behavior remain intact. Nonproduction fallback ignores spoofed headers and uses 127.0.0.1 only for loopback development URLs with no configured/supplied proxy proof. This assumes the dev server stays bound to loopback: Fetch Request does not expose the socket peer, so URL checking is not a transport ACL.
- Secret validation is request-time, not import/build-time. No production proxy secret default was added.

## Executed evidence

- TDD reproduced the original defects before integration: forged-proof wrapper request returned **200 instead of 503**; exhausting address A also caused address B to return **429 instead of 401**. Both pass after the fix.
- Final private isolated-DB run of `tests/backend-proxy.test.ts`: **8 tests, 8 passed, 0 failed, 0 skipped**. Credentials were read programmatically from the existing private JSON, not printed. Only the isolated `127.0.0.1:55432/warrantyidea_test?schema=warrantyidea` database was used.
- Real Better Auth handler: address A returned **401,401,401,401,401,429** despite changing spoofed XFF/internal headers; independently authenticated address B returned **401**. Database readback found exactly two matching buckets, counts **1 and 5**. Randomized test identities avoid deleting/resetting existing buckets.
- Isolated child processes started with `NODE_ENV=production` and an HTTPS loopback auth origin, with absent and weak proxy configuration: both returned sanitized **503/no-store**, with no new rate-limit rows. No concurrent mutation of the parent process NODE_ENV; no production webapp calls.
- Without isolated DB credentials: **5 passed, 3 skipped, 0 failed**. Scoped ESLint on all four owned implementation/test files exited **0**, no warnings.
- Existing `tests/backend-auth.test.ts` was exercised unchanged: **both tests passed**, including registration/Argon2id/session/logout/Origin/schema checks and spoofed-XFF rate limiting. The initial combined run had one new production-child fixture failure (HTTP origin prohibited in production); correcting that fixture to HTTPS made the targeted test and final proxy suite pass.
- No migrations, resets, fixture cleanup/deletion, live proxy/network/firewall changes or Git writes were performed. Generated isolated test records were retained.

## Deployment follow-up — approval required / UNVERIFIED

**Production proxy setup remains UNVERIFIED. This report proves application behavior, not deployed infrastructure.**

Before deployment, an authorized operator must provision a unique high-entropy `TRUSTED_PROXY_SECRET` (at least 32 characters) in the application environment and the trusted proxy's secret store; configure that proxy to overwrite, never append or forward client-provided, `X-Real-IP` and `x-warrantyidea-proxy-secret`; keep the backend restricted to the approved trusted transport; and prevent proof leakage in access logs. Never send the secret to browsers. Existing production auth will intentionally return 503 until the handoff is configured correctly.

Parent follow-up: rebuild the production artifact after this change; update the environment template/deployment documentation to explain the required secret and overwrite contract, subject to user-approved scope. Rebuild and real deployed proxy behavior were not verified by this focused subtask.

Owned changes: `src/lib/server/auth.ts`, new `src/lib/server/trusted-proxy.ts`, `src/app/api/auth/[...all]/route.ts`, new `tests/backend-proxy.test.ts`, and this report. No auth-test edits or unrelated parent edits were made.
