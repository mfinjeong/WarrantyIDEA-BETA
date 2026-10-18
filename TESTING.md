# Isolated verification

These tests write generated test accounts and warranties. Never run database-writing tests against `webapp_db`, a production URL, or an unknown existing app server. No database reset/seed/automatic fixture cleanup is required; generated accounts/audit evidence are retained. DELETE coverage removes only warranties generated within the same explicit CRUD test. Logout revokes only that test session. There is no bulk data cleanup.

## Safety guards

- Runtime database: `127.0.0.1:55432/warrantyidea_test?schema=warrantyidea`.
- Server started with that same private test environment, not simply a client claiming that URL.
- App HTTP origin: `http://127.0.0.1:3000` in development; no public bind.
- Unit/database tests require `WARRANTYIDEA_TEST_DB_ALLOW_WRITES=1` or `ALLOW_ISOLATED_HTTP_TESTS=1`.
- Browser writes require `WARRANTYIDEA_E2E_ALLOW_WRITES=1`.
- HTTP tests require `ALLOW_ISOLATED_HTTP_TESTS=1` and validate database name/host/port.
- Database tests without DATABASE_URL are explicitly skipped; a configured non-isolated target is rejected rather than used.
- Auth rate-limit tests retain their rate-limit records. Browser registration honors a real 429 Retry-After; test timeouts allow that protocol delay instead of disabling the limiter or wiping its table.

## Portable PowerShell commands

Prepare a private Git-ignored `.env.test` with the isolated runtime/migration URLs, random BETTER_AUTH_SECRET, BETTER_AUTH_URL=http://127.0.0.1:3000, APP_TIMEZONE=Asia/Jakarta and NODE_ENV=development. Do not copy production credentials into this file. Keep migration credentials out of the app runtime environment where practical. Never paste secrets in chat.

```powershell
Set-Location C:\Users\Administrator\Projects\WarrantyIDEA-BETA
$env:ALLOW_ISOLATED_HTTP_TESTS = '1'
$env:WARRANTYIDEA_E2E_ALLOW_WRITES = '1'
# Review SQL before applying, using only isolated migration-role credentials:
node --env-file=.env.test node_modules/prisma/build/index.js migrate status
node --env-file=.env.test node_modules/prisma/build/index.js migrate deploy
node --env-file=.env.test node_modules/prisma/build/index.js generate
# Start this exact test server in a separate local terminal; do not reuse an unknown server.
node --env-file=.env.test node_modules/next/dist/bin/next dev --hostname 127.0.0.1
```

From a second local terminal using the same environment:

```powershell
npm run lint
npm run typecheck
node --env-file=.env.test node_modules/tsx/dist/cli.mjs --test tests/*.test.ts tests/browser/*.test.ts
node --env-file=.env.test --test tests/http-integration.mjs
node --env-file=.env.test node_modules/playwright/cli.js test --reporter=list
```

Stop only the test server before a production build to avoid simultaneous development/build resource use. Build with a separately secured production-shaped **test** env: NODE_ENV=production, isolated DATABASE_URL, a random auth secret, and an explicit HTTPS BETTER_AUTH_URL. No production migration or proxy/firewall change is needed for a build. Production auth requires the approved proxy proof described in DEPLOYMENT.md; an HTTP development sign-in test is not a real public TLS deployment check.

## Current VPS verification helper

The task's private environment is stored outside Git in the Hermes scratch workspace. The helper loads it into child-process environment variables without printing credentials:

```powershell
$runner = 'C:\Users\Administrator\AppData\Local\hermes\cache\scratch\run-warranty-test-env.py'
python $runner node node_modules/tsx/dist/cli.mjs --test tests/*.test.ts tests/browser/*.test.ts
python $runner node --test tests/http-integration.mjs
$env:WARRANTYIDEA_E2E_ALLOW_WRITES = '1'
python $runner node node_modules/playwright/cli.js test --reporter=list
python $runner --production node node_modules/next/dist/bin/next build
```

This scratch cluster/helper is temporary verification infrastructure, not production deployment or a durable backup. Exact observed results, failed intermediate checks and remaining unexecuted operational gates are recorded in BACKEND_VERIFICATION.md. Do not infer success from a command example.
