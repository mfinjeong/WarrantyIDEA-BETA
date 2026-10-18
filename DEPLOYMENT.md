# Windows Server 2022 deployment runbook

## Current safety boundary

The existing PostgreSQL 18.6 instance and `webapp_db` are NOT modified by the development verification. The implementation is verified against a separate, loopback-only PostgreSQL 18.6 cluster/database. Access credentials and an authorized existing-schema inspection/backup are required before migrating `webapp_db`.

Do not declare this instance ready for public traffic until every production gate below is satisfied. No firewall rule, PostgreSQL service configuration, public listener, DNS record or HTTPS binding is changed automatically. No Git identity, commit or push is performed.

Commands below are **PowerShell commands**, run manually on the VPS, not Git Bash. Replace placeholders locally; never paste passwords/tokens into chat.

## 1. Prerequisites and source

```powershell
Set-Location C:\Users\Administrator\Projects\WarrantyIDEA-BETA
node --version
npm --version
git status --short --branch
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' --version
npm ci
```

Use the committed lockfile, Node.js 24 LTS and PostgreSQL 18.6. Do not auto-upgrade the production database or use `npm audit fix --force`. Dependencies and generated Prisma Client are installed/generated during setup/build, not copied from a developer's `node_modules`.

## 2. Inspect and back up the existing database FIRST

Obtain the database administrator's approval/access outside chat. `-W` prompts on the local console; it does not put a password in command history.

```powershell
$pg = 'C:\Program Files\PostgreSQL\18\bin'
& "$pg\psql.exe" -X -W -h 127.0.0.1 -U postgres -d webapp_db -c 'SELECT current_database(), version();'
& "$pg\psql.exe" -X -W -h 127.0.0.1 -U postgres -d webapp_db -c "SELECT schema_name FROM information_schema.schemata ORDER BY schema_name;"
& "$pg\psql.exe" -X -W -h 127.0.0.1 -U postgres -d webapp_db -c "SELECT schemaname, tablename FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema') ORDER BY 1,2;"
```

Choose an approved private backup directory, for example a restricted backup volume:

```powershell
$backup = 'D:\PrivateBackups\webapp_db-before-warrantyidea.dump'
& "$pg\pg_dump.exe" -W -h 127.0.0.1 -U postgres -d webapp_db -Fc -f $backup
if ($LASTEXITCODE -ne 0) { throw 'Backup failed. Do not migrate.' }
& "$pg\pg_restore.exe" --list $backup
if ($LASTEXITCODE -ne 0) { throw 'Backup archive cannot be read. Do not migrate.' }
```

Check restoration on a separately approved disposable database before production rollout; listing an archive is not a restore test. Never run restore over `webapp_db` without explicit approval. If schema `warrantyidea` or matching role/table names already exist, STOP and inspect/baseline; do not reset, drop, rename, overwrite, or blindly run an empty initial migration. Existing unrelated schemas/data remain intact.

## 3. Dedicated database roles and schema

Review `deploy/provision.sql` before execution. It creates only **new** `warrantyidea_migrator` and `warrantyidea_app` roles and a dedicated `warrantyidea` schema inside the existing database. It aborts on name collisions. No existing schema/table is dropped or reset. It intentionally does not revoke PUBLIC grants from other applications.

```powershell
& "$pg\psql.exe" -X -W -h 127.0.0.1 -U postgres -d webapp_db -v ON_ERROR_STOP=1 -f deploy/provision.sql
if ($LASTEXITCODE -ne 0) { throw 'Provisioning failed; inspect before retrying.' }
```

Set the two different passwords at the local `\password` prompts. Store them only in secured environment files or a secret manager. Passwords used in connection URLs must be percent-encoded.

- Runtime: `warrantyidea_app`, CONNECT + schema USAGE + necessary table DML/sequence privileges. No superuser, schema ownership, role/database creation, replication, or bypass-RLS.
- Migration: `warrantyidea_migrator`, owner of ONLY the new schema/tables. Not the running application identity.
- Existing database-wide PUBLIC or inherited grants can still give privileges on unrelated schemas. Audit them explicitly with the DBA. If overly broad, agree on a scoped remediation rather than silently changing a shared database's security.
- Application authorization still enforces owner access on every buyer read/write. Database role separation is not a substitute for authorization.

## 4. Environment files (never commit)

Copy `.env.example` to `.env.production` and edit locally. Use the runtime DATABASE_URL and exact HTTPS origin. Generate the auth secret locally:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Do not paste that result into chat, logs or Git. Runtime file variables:

- `DATABASE_URL`: restricted runtime connection to `127.0.0.1:5432/webapp_db?schema=warrantyidea`.
- `BETTER_AUTH_SECRET`: at least 32 cryptographically random characters; rotating it invalidates sessions.
- `BETTER_AUTH_URL`: exact public HTTPS origin, for example `https://warranty.example.com`. No wildcard origins.
- `TRUSTED_PROXY_SECRET`: a **different** random secret of at least 32 characters, present only in the private app/proxy environments. Production auth requests need verified proxy proof; no usable proxy proof/config is provisioned automatically.
- `APP_TIMEZONE`: business calendar timezone, default/intended `Asia/Jakarta`.
- `NODE_ENV=production`.

Create a separate `.env.migrate` locally containing `DATABASE_URL` and `MIGRATION_DATABASE_URL` both set to the migration role's URL. Do **not** include `MIGRATION_DATABASE_URL` in the running application's environment. Both `.env.production` and `.env.migrate` are Git-ignored. Restrict their ACLs to Administrators/SYSTEM and the specific account that needs each one. The runtime service account must NOT read the migration env file.

Example ACL commands after choosing an existing dedicated service account; inspect existing ACLs before changing them:

```powershell
icacls .env.production
icacls .env.migrate
# Apply only after review; replace VPSNAME\WarrantyIDEAService with the actual account.
# icacls .env.production /inheritance:r /grant:r 'BUILTIN\Administrators:F' 'NT AUTHORITY\SYSTEM:F' 'VPSNAME\WarrantyIDEAService:R'
# icacls .env.migrate /inheritance:r /grant:r 'BUILTIN\Administrators:F' 'NT AUTHORITY\SYSTEM:F'
```

Do not run the Node web process as Administrator. Keep source/build read-only to the service account except the Next.js cache directory it requires. Keep private backups outside publicly served directories.

## 5. Safe migrations and production build

Review the SQL under `prisma/migrations/`. Initial migration adds namespaced tables/constraints/indexes; it is not permission to overwrite an existing conflicting schema. Prisma `migrate deploy` does not detect all schema drift: the manual inspection/backup gate remains required.

```powershell
node --env-file=.env.migrate node_modules/prisma/build/index.js migrate status
node --env-file=.env.migrate node_modules/prisma/build/index.js migrate deploy
if ($LASTEXITCODE -ne 0) { throw 'Migration failed. Do not start/retry destructively.' }
& "$pg\psql.exe" -X -W -h 127.0.0.1 -U warrantyidea_migrator -d webapp_db -v ON_ERROR_STOP=1 -f deploy/runtime-grants.sql
if ($LASTEXITCODE -ne 0) { throw 'Runtime grants failed.' }
node --env-file=.env.production node_modules/prisma/build/index.js generate
npm run lint
npm run typecheck
npm test
node --env-file=.env.production node_modules/next/dist/bin/next build
if ($LASTEXITCODE -ne 0) { throw 'Build failed. Do not deploy.' }
```

Run database-writing integration/browser tests ONLY against the dedicated test database, never production. `tests/http-integration.mjs` rejects non-isolated database targets. Never use `prisma migrate reset`, `prisma db push --accept-data-loss`, `DROP SCHEMA`, or a production seed/reset to fix errors. For failed migrations, inspect `_prisma_migrations` and follow a reviewed forward-fix/baseline process with the DBA.

Prisma migration history is not application data: `deploy/runtime-grants.sql` revokes the runtime role's access to `_prisma_migrations` after granting normal DML. Repeat that script after migrations. Verify permission boundaries locally:

```powershell
& "$pg\psql.exe" -X -W -h 127.0.0.1 -U warrantyidea_app -d webapp_db -c "SELECT current_user, has_schema_privilege(current_user, 'warrantyidea', 'USAGE') AS schema_usage, has_schema_privilege(current_user, 'warrantyidea', 'CREATE') AS can_create;"
```

Expected schema USAGE true, CREATE false. Inspect role flags and inherited/PUBLIC permissions as well. Do not test destructive SQL on production.

## 6. Run privately, then persist after restart

```powershell
powershell.exe -NoProfile -File .\deploy\run-production.ps1
# In a second local terminal (no firewall change):
Invoke-WebRequest http://127.0.0.1:3000/login -UseBasicParsing
Get-NetTCPConnection -State Listen -LocalPort 3000
```

The script binds ONLY `127.0.0.1`. With a production HTTPS origin configured, real sign-in is tested through that exact HTTPS reverse proxy, not by changing the browser origin to a public HTTP IP. Before proxy approval, local private functionality can be tested with a separate nonproduction test environment.

For persistent execution, use **Windows Task Scheduler** under an approved dedicated non-administrator account:

1. Create Task → run whether user is logged on or not; do not enable highest privileges unless separately justified.
2. Trigger: At startup, optionally delay 30 seconds for PostgreSQL. Confirm the existing PostgreSQL service is Automatic; do not silently change it.
3. Program: `C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`.
4. Arguments: `-NoProfile -File "C:\Users\Administrator\Projects\WarrantyIDEA-BETA\deploy\run-production.ps1"`.
5. Start in: `C:\Users\Administrator\Projects\WarrantyIDEA-BETA`.
6. Settings: restart on failure every minute, high retry count, no execution time limit; if already running, do not start a second instance. Ensure the account has Log on as a batch job and read access to runtime env/build; it does not need admin or migration credentials.
7. Store task credentials through the Task Scheduler credential dialog, not code/chat. Configure private log capture/rotation and monitoring. Test startup/reboot only in an approved maintenance window; verify task result, Node listener and database connectivity after restart.

Task creation, service account changes and reboot have NOT been performed automatically. The Administrator home is a development path; an approved production service directory such as `C:\Services\WarrantyIDEA` with suitable ACLs is preferable. Copy reviewed source/build there if selected and adjust the task path; never move/delete user files without approval.

## 7. Reverse proxy, public IP, DNS and HTTPS (approval required)

Recommended layout: browser → HTTPS reverse proxy on 443 → `127.0.0.1:3000` → PostgreSQL loopback 5432.

- Use an approved Windows-compatible proxy such as IIS + ARR/URL Rewrite or Caddy. Install/configure it only with approval. Preserve the public Host, forward scheme accurately (`X-Forwarded-Proto: https`), and replace rather than trust arbitrary client-supplied forwarding headers.
- Apply request body limits, upstream timeouts, connection/rate limits and access logging at the proxy. Keep app/session responses private/no-store. Do not cache authenticated APIs or cookies. Never rewrite arbitrary external destinations.
- The approved proxy must **overwrite** `X-Real-IP` with its socket client's validated IP and `X-WarrantyIDEA-Proxy-Secret` with the private `TRUSTED_PROXY_SECRET`. Remove any caller-supplied `X-WarrantyIDEA-Client-IP`; the application derives its internal rate-limit address only after verifying proxy proof. Never embed the proof in frontend code, send it to a browser, or record it in access logs. Arbitrary forwarded IPs without proof must not select an auth rate-limit bucket. If another trusted upstream/load balancer exists, review that chain explicitly rather than trusting its incoming headers by default.
- This avoids the old shared-global auth bucket (which allowed one client to throttle everyone). **Production auth intentionally fails closed** if secret/proof/IP is missing or invalid. Until an approved HTTPS proxy is configured and verified end-to-end, registration/login in production are not considered deployed. No live proxy settings were changed as part of implementation.
- Domain: create an A record to the VPS public IPv4; create AAAA only if IPv6 is intentionally configured. Set `BETTER_AUTH_URL` to that exact domain's HTTPS origin before building/restarting.
- Obtain/renew a trusted TLS certificate. Redirect HTTP to HTTPS at the proxy. Enable HSTS only once HTTPS/domain behavior is confirmed. Secure cookies are required in production; public-IP HTTP is NOT a production login solution.
- Without a domain, use a deliberate trusted HTTPS certificate strategy or a private tunnel. Do not turn off cookie security/Origin checks to make raw-IP HTTP work.
- Windows Firewall and cloud firewall/security group: after explicit approval, allow only required public 80/443 to the proxy; restrict RDP to trusted sources. Do not allow 3000 or 5432 from the internet. Audit IPv4 and IPv6. Do not assume Windows Firewall alone overrides cloud exposure, or vice versa.
- This VPS's existing 5432 listener was observed on `0.0.0.0` and `::`. Public reachability is NOT verified. Before production, review approved clients, set `listen_addresses = '127.0.0.1'` (and `::1` only if needed) or explicitly approved private interfaces, and remove/limit broad database firewall/security-group rules. This needs approval and may require a PostgreSQL restart affecting other users.
- In `pg_hba.conf`, use narrowly scoped SCRAM rules for the intended database/user/loopback addresses, preserving necessary DBA/other-app access. Rule order matters (first match). No `trust`, no broad `0.0.0.0/0` or `::/0` application allowance. Reload/restart only after review/approval.

## 8. Initial admin and operational gates

Registration always creates a buyer; role is never accepted from a client. Use an authorized DBA/migration session to promote an explicitly approved existing user by their exact registered email, using a parameterized administrative operation or reviewed psql variable, never a public signup role field. Log the decision; do not automatically promote a test account in `webapp_db`. Sign out/in after role changes. Ensure no test users exist in the production database.

Before public release, confirm: inspected existing schema, backup/restore rehearsal, applied migration and runtime grants, HTTPS/auth origin/cookie checks, private database/app listeners, firewall/cloud rules, task restart test, least-privilege runtime account/ACLs, admin ownership, monitoring, recovery, dependency audit and the test/build results in `BACKEND_VERIFICATION.md`.

Remaining feature boundaries: camera/OCR remain simulated; receipt images remain session-local previews (not secure persisted uploads). In-app reminders are generated when data is requested, not scheduled email/push. These limits must stay visible in UI; do not promise services that do not exist. Email verification/password recovery, if not configured, are not enabled by invented email delivery.

## Primary references

- https://nextjs.org/docs/app/guides/self-hosting
- https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production
- https://www.postgresql.org/docs/18/runtime-config-connection.html
- https://www.postgresql.org/docs/18/auth-pg-hba-conf.html
- https://www.better-auth.com/docs/concepts/security
