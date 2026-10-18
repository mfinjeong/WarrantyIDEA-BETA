import { endpoint, ok, jsonBody } from "@/lib/server/http";
import { requireUser } from "@/lib/server/session";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import {
  getWarranty,
  saveWarranty,
  removeWarranty,
} from "@/lib/server/service";
import { idInput } from "@/lib/server/validation";
export const GET = endpoint<{ id: string }>(async (request, context) =>
  ok(
    await getWarranty(
      await requireUser(request),
      idInput.parse((await context.params).id),
    ),
  ),
);
export const PUT = endpoint<{ id: string }>(async (request, context) =>
  ok(
    await saveWarranty(
      await requireUser(request),
      await jsonBody(request),
      idInput.parse((await context.params).id),
    ),
  ),
);
export const DELETE = endpoint<{ id: string }>(async (request, context) =>
  ok(
    await removeWarranty(
      await requireUser(request),
      idInput.parse((await context.params).id),
    ),
  ),
);
