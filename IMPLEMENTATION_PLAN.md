# Backend implementation plan

## Inspected baseline
- Clean clone on main, no pre-existing local changes. Next.js 16 App Router, React 19, strict TypeScript, Tailwind; Node 24.
- Existing provider is the application data boundary. Warranty, catalog, admin review, notification and profile screens all consume it. localStorage currently stores fictitious demo data.
- Warranty fields: product name/brand/model/category, unique per-owner serial, store, purchase/expiry calendar dates, optional rupiah price, notes, review decision. Catalog maintains active products and default warranty months.
- Buyer dashboard, admin dashboard/catalog/review queue, notifications and profile need persistence and role enforcement. Scan/OCR and receipt previews are explicitly simulated, not silently upgraded to real OCR or upload.
- Baseline lint/typecheck and 5 domain tests pass. npm audit reports 5 high vulnerabilities to investigate, not blindly force-upgrade.
- PostgreSQL installed version verified 18.6. Existing webapp_db requires unavailable credentials. Listener is wildcard IPv4/IPv6; firewall exposure is unknown. No existing database data/config/firewall will be changed without authorization.

## Stages
1. Add normalized Prisma schema and additive initial migration, Better Auth/Argon2id auth, runtime/migration role separation; no production migration until existing schema/backup/access checks.
2. Add authenticated Next.js route handlers: per-owner warranty CRUD/query, catalog and admin reviews, settings, notifications, dashboard/workspace snapshot, with Zod validation and safe error responses.
3. Replace demo provider persistence with API calls, real auth/logout and protected server layouts; retain components/classes/design. Server-driven warranty search/filter/sort/pagination; no business-data localStorage fallback.
4. Run tests against an isolated loopback-only PostgreSQL 18.6 test cluster. Add HTTP auth/CRUD/isolation/admin tests and update browser scenarios. Run lint/typecheck/unit/integration/browser/build, fix issues, review independently.
5. Write Windows deployment/runbook, .env.example, safe least-privilege provisioning templates and migration instructions. Do not expose publicly, modify firewall/services/Git identity, commit or push.

## Shared implementation contract
Backend files owned by backend workstream: prisma/, prisma.config.ts, src/lib/server/, src/app/api/, package.json/package-lock.json, tests/backend*.test.ts. Frontend files owned by frontend workstream: src/lib/demo/provider.tsx/types.ts, src/lib/api-client.ts, src/lib/auth-client.ts, features/, components/layout/, protected app layouts, tests/browser/. Parent owns docs, deployment scripts and integration verification.

- Better Auth routes at /api/auth/[...all], native library response shapes. Frontend createAuthClient from better-auth/react; signUp.email, signIn.email, signOut; get-session returns {user,session} or null. User.role is buyer/admin (server-controlled); register never accepts role.
- Application API success { data: T }, failure { error: { code: string, message: string, details?: unknown } }; HTTP status meaningful. fetch credentials same-origin and no-store.
- GET /api/workspace?scope=buyer|admin -> data shaped like DemoState (version:1,warranties,catalog,notifications,profile,activity), profile additionally {email,role}; add stats {total,active,expiring,expired,catalog,pending,approved}. Buyer data is always only current user's; scope=admin requires admin role.
- GET /api/warranties?q=&status=active|expiring|expired&category=electronics|home|other&sort=newest|expiry|name&page=1&pageSize=6 -> data {items,total,page,pageSize,pages}; buyer owner-only. Admin review data uses /api/workspace?scope=admin; no cross-owner mutation via buyer CRUD.
- GET /api/warranties/:id -> data Warranty (own only); POST /api/warranties input WarrantyInput -> data Warranty; PUT /api/warranties/:id same; DELETE -> data {id}.
- POST /api/catalog input CatalogProduct (id optional/empty to create), admin only -> data CatalogProduct.
- POST /api/reviews/:id input {status:pending|approved|rejected,note?:string}, admin only -> data Warranty; add persistent buyer notification and audit activity.
- PATCH /api/profile {name,reminders} -> data {name,reminders,email,role}.
- PATCH /api/notifications/:id {read:boolean}; PATCH /api/notifications {audience:buyer|admin}; authorize ownership and role.
- GET /api/dashboard?scope=buyer|admin -> data counts matching stats.
- src/lib/server/session.ts exports requirePageUser(admin?:boolean) for server layouts; redirects unauthenticated to login and denies buyer admin access. Exports requireUser(request?) for route auth if useful.
- Keep original Warranty shape flattened to avoid rewriting presentation; normalized product/purchase records mapped server-side. Dates serialized YYYY-MM-DD; timestamps ISO; price number (safe integer).
- UI may preserve receipt previews as local ephemeral files (explicitly labelled) and scan simulation, never represent them as persisted uploads/OCR. Production reset-data action disabled/removed.
