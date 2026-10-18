# API and data contract

## Authentication

Better Auth handles `/api/auth/*` with its maintained library protocol, not the application response envelope. Browser uses the official same-origin Better Auth client.

- `POST /api/auth/sign-up/email`: `{name,email,password}`. Password minimum 12 characters. Role is never client-controlled.
- `POST /api/auth/sign-in/email`: `{email,password}`.
- `POST /api/auth/sign-out`: terminates server-side session.
- `GET /api/auth/get-session`: current session/user or unauthenticated result.

Do not store tokens in localStorage or expose password hashes in a DTO. Production requires the configured exact HTTPS origin; cookies must be HttpOnly/Secure/SameSite. Auth uses server-side database-backed rate limiting; reverse proxy should enforce additional abuse limits.

## Application responses

Successful responses: `{ "data": ... }` with meaningful HTTP status (201 for creation).
Errors: `{ "error": { "code": "...", "message": "...", "details": ... } }`. Details are optional validation information, not stack traces/SQL/connection strings. APIs are authenticated and no-store. Unknown or another user's warranty returns 404, never its data. Input is validated server-side regardless of client validation. Mutation requests require the configured same-origin `Origin` header and JSON content type.

## Warranty endpoints (current user only, including an admin's personal workspace)

- `GET /api/warranties`: query `q`, `status=active|expiring|expired`, `category=electronics|home|other`, `sort=newest|expiry|name`, `page` (positive integer), `pageSize` (bounded positive integer). Returns `{items,total,page,pageSize,pages}` in `data`.
- `POST /api/warranties`: full `WarrantyInput`, returns persisted Warranty, status 201.
- `GET /api/warranties/:id`: owner-scoped detail.
- `PUT /api/warranties/:id`: full validated edit, resets review to pending.
- `DELETE /api/warranties/:id`: owner-scoped deletion of selected warranty, returns `{id}`.

WarrantyInput:

```typescript
{
  productName: string; // 2–100 trimmed characters
  brand: string;       // 2–60
  model: string;       // 2–60
  category: "electronics" | "home" | "other";
  serialNumber: string; // 3–80, case-insensitive uniqueness per owner
  store: string;        // 2–100
  purchaseDate: string; // real YYYY-MM-DD, not in future business calendar day
  expiryDate: string;   // real YYYY-MM-DD, not before purchaseDate
  price?: number;      // whole rupiah, 0 through 999999999999
  notes: string;       // maximum 1000
}
```

Clients cannot set ownership, timestamps, review decisions or roles. Warranty DTO retains the existing UI's flattened shape: id, the fields above, reviewStatus, optional reviewNote, createdAt/updatedAt. Calendar dates use `YYYY-MM-DD`; timestamps ISO; prices serialize to safe integers, not raw BigInt/Decimal objects.

Status is calculated, not stale stored text: expired when expiry is before the business calendar day, expiring from today through day 30 inclusive, active thereafter. Business timezone is configured by APP_TIMEZONE.

## Dashboard/workspace

- `GET /api/dashboard?scope=buyer|admin`: counts `{total,active,expiring,expired,catalog,pending,approved}`. Buyer counts only own data; admin scope requires admin role and is for review operations.
- `GET /api/workspace?scope=buyer|admin`: UI bootstrap `{version:1,warranties,catalog,notifications,profile,activity,stats}`. Profile includes `{name,reminders,email,role}`. Admin scope is explicitly authorized; it is not enabled by switching a frontend label.

Warranty listing/search is separately paginated. Do not treat a bootstrap snapshot as an unlimited archive.

## Profile and notifications

- `PATCH /api/profile`: `{name,reminders}`; returns own saved profile with email/role read-only.
- `PATCH /api/notifications/:id`: `{read:boolean}`; checks owner/authorized audience.
- `PATCH /api/notifications`: `{audience:"buyer"|"admin"}`; marks own authorized audience read, never another user's notifications.

## Admin

- `POST /api/catalog`: `{id?,name,brand,model,category,warrantyMonths,active}`; inserts/updates catalog, validates unique brand/model and duration. Buyer writes forbidden.
- `POST /api/reviews/:id`: `{status:"pending"|"approved"|"rejected",note?:string,expectedRevision:number}`; the revision must match the Warranty DTO observed by the reviewer. Stale edits/decisions return 409 before decisions, notifications or audit activity are written. Buyer writes forbidden.

No public promote-to-admin API and no production demo-reset endpoint exist. Registration never grants admin. Database role/admin promotions need a separately approved administrative action.

## Environment

- `DATABASE_URL`: least-privilege runtime PostgreSQL connection, schema warrantyidea.
- `MIGRATION_DATABASE_URL`: schema-owner connection for migration process only (do not give runtime access).
- `BETTER_AUTH_URL`: exact canonical origin, HTTPS in production.
- `BETTER_AUTH_SECRET`: cryptographically random secret at least 32 characters.
- `TRUSTED_PROXY_SECRET`: separate random server-only proof shared with an explicitly approved loopback reverse proxy. The proxy must overwrite X-Real-IP and X-WarrantyIDEA-Proxy-Secret, not forward caller-controlled values. Production authentication fails closed without verified proxy proof; this does not configure a proxy or authorize publication.
- `APP_TIMEZONE`: IANA timezone for calendar business rules.
- `NODE_ENV`: production for production runtime.

`.env.example` contains placeholders only. See DEPLOYMENT.md for exact setup and BACKEND_VERIFICATION.md for real observed test results/remaining gates.

## Client identity and business calendar

Workspace bootstrap includes `profile.id` and `calendar.timeZone` (only the public IANA calendar identifier, not server environment secrets). UI forms/previews/drafts are separated by user identity; the browser uses the server business timezone rather than its device calendar. The current date is recalculated, including on day rollover.

The browser API adapter sends `X-Workspace-User` with mutations, binding a stale form to the account that produced it. The server compares this to the authoritative cookie session and returns `409 SESSION_CHANGED` on mismatch before side effects. This header is a stale-session guard, never an identity credential or substitute for session/owner authorization. Nonbrowser API clients may omit it; session authorization always applies.
