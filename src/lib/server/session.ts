import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { HttpError } from "./http";
export async function requireUser(request?: Request) {
  const session = await auth.api.getSession({
    headers: request?.headers ?? (await headers()),
  });
  if (!session) throw new HttpError(401, "UNAUTHENTICATED", "Please sign in.");
  const expectedUser = request?.headers.get("x-workspace-user");
  if (expectedUser && expectedUser !== session.user.id)
    throw new HttpError(409, "SESSION_CHANGED", "Akun telah berubah. Muat ulang ruang kerja sebelum melanjutkan.");
  return session.user;
}
export type AppUser = Awaited<ReturnType<typeof requireUser>>;
export function requireAdmin(user: AppUser) {
  if (user.role !== "admin")
    throw new HttpError(403, "FORBIDDEN", "Administrator access is required.");
}
export async function requirePageUser(admin = false) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect(admin ? "/admin/login" : "/login");
  if (admin && session.user.role !== "admin") redirect("/app");
  return session.user;
}
