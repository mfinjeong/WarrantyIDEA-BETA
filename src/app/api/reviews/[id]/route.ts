import { endpoint, ok, jsonBody } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { reviewWarranty } from "@/lib/server/service";
import { idInput } from "@/lib/server/validation";
export const POST = endpoint<{ id: string }>(async (request, context) =>
  ok(
    await reviewWarranty(
      await requireUser(request),
      idInput.parse((await context.params).id),
      await jsonBody(request),
    ),
  ),
);
