import { endpoint, ok, jsonBody } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { markNotification } from "@/lib/server/service";
import { idInput, readInput } from "@/lib/server/validation";
export const PATCH = endpoint<{ id: string }>(async (request, context) =>
  ok(
    await markNotification(
      await requireUser(request),
      idInput.parse((await context.params).id),
      readInput.parse(await jsonBody(request)).read,
    ),
  ),
);
