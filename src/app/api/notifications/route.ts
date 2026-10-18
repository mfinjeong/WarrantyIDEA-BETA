import { endpoint, ok, jsonBody } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { markAllNotifications } from "@/lib/server/service";
import { audienceInput } from "@/lib/server/validation";
export const PATCH = endpoint(async (request) =>
  ok(
    await markAllNotifications(
      await requireUser(request),
      audienceInput.parse(await jsonBody(request)).audience,
    ),
  ),
);
