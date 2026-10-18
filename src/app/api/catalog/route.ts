import { endpoint, ok, jsonBody } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { upsertCatalog } from "@/lib/server/service";
export const POST = endpoint(async (request) =>
  ok(await upsertCatalog(await requireUser(request), await jsonBody(request))),
);
