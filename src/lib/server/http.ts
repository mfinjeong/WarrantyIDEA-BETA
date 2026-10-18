import { z } from "zod";
import { authOrigin } from "./config";
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export const fail = (
  status: number,
  code: string,
  message: string,
  details?: unknown,
) =>
  Response.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
export const ok = (data: unknown, status = 200) =>
  Response.json({ data }, { status, headers: { "Cache-Control": "no-store" } });
export function checkOrigin(request: Request) {
  if (
    !["GET", "HEAD", "OPTIONS"].includes(request.method) &&
    request.headers.get("origin") !== authOrigin()
  )
    throw new HttpError(
      403,
      "INVALID_ORIGIN",
      "Request origin is not allowed.",
    );
}
export async function jsonBody(request: Request) {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw new HttpError(415, "UNSUPPORTED_MEDIA_TYPE", "Expected JSON.");
  if (Number(request.headers.get("content-length")) > 16384)
    throw new HttpError(413, "BODY_TOO_LARGE", "Request body too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "INVALID_JSON", "Expected JSON.");
  let text = "",
    length = 0;
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 16384) {
      await reader.cancel();
      throw new HttpError(413, "BODY_TOO_LARGE", "Request body too large.");
    }
    text += decoder.decode(value, { stream: true });
  }
  try {
    return JSON.parse(text + decoder.decode()) as unknown;
  } catch {
    throw new HttpError(400, "INVALID_JSON", "Invalid JSON.");
  }
}
export function errorResponse(error: unknown) {
  if (error instanceof HttpError)
    return fail(error.status, error.code, error.message);
  if (error instanceof z.ZodError)
    return fail(
      400,
      "VALIDATION_ERROR",
      "Please check your input.",
      error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    );
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? error.code
      : undefined;
  if (code === "P2002")
    return fail(409, "CONFLICT", "A record with these details already exists.");
  if (code === "P2025") return fail(404, "NOT_FOUND", "Record not found.");
  return fail(500, "INTERNAL_ERROR", "The request could not be completed.");
}
export function endpoint<
  P extends Record<string, string> = Record<never, never>,
>(
  fn: (request: Request, context: { params: Promise<P> }) => Promise<Response>,
) {
  return async (request: Request, context: { params: Promise<P> }) => {
    try {
      checkOrigin(request);
      return await fn(request, context);
    } catch (error) {
      return errorResponse(error);
    }
  };
}
