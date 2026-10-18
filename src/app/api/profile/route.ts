import { endpoint, ok, jsonBody } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { updateProfile } from "@/lib/server/service";
export const PATCH = endpoint(async (request) =>
  ok(await updateProfile(await requireUser(request), await jsonBody(request))),
);
