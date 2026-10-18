export class ApiError extends Error {
  constructor(message: string, public status: number, public code: string, public details?: unknown) { super(message); this.name = "ApiError"; }
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { ...init, credentials: "same-origin", cache: "no-store", headers: { "Content-Type": "application/json", ...init.headers } });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(body?.error?.message || "Permintaan gagal. Silakan coba lagi.", response.status, body?.error?.code || "REQUEST_FAILED", body?.error?.details);
  if (!body || !("data" in body)) throw new ApiError("Respons server tidak valid.", response.status, "INVALID_RESPONSE");
  return body.data as T;
}
