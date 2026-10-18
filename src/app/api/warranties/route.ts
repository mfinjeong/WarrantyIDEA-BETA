import { endpoint, ok, jsonBody } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { listWarranties, saveWarranty } from "@/lib/server/service";
export const GET = endpoint(async (request) =>
  ok(
    await listWarranties(
      await requireUser(request),
      Object.fromEntries(new URL(request.url).searchParams),
    ),
  ),
);
export const POST = endpoint(async (request) =>
  ok(
    await saveWarranty(await requireUser(request), await jsonBody(request)),
    201,
  ),
);
