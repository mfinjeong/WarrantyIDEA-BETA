import { endpoint, ok } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { workspace } from "@/lib/server/service";
import { scopeQuery } from "@/lib/server/validation";
export const GET = endpoint(async (request) =>
  ok(
    await workspace(
      await requireUser(request),
      scopeQuery.parse(Object.fromEntries(new URL(request.url).searchParams))
        .scope,
    ),
  ),
);
