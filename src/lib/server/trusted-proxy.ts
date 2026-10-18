import { createHash, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import { HttpError } from "./http";

type ProxyEnvironment = { NODE_ENV?: string; TRUSTED_PROXY_SECRET?: string };

/** Public auth routes must sanitize untrusted headers before Better Auth. */
export function prepareAuthRequest(
  request: Request,
  env: ProxyEnvironment = process.env,
): Request {
  const unavailable = () =>
    new HttpError(
      503,
      "AUTH_PROXY_UNAVAILABLE",
      "Authentication is temporarily unavailable.",
    );
  const secret = env.TRUSTED_PROXY_SECRET;
  const proof = request.headers.get("x-warrantyidea-proxy-secret");
  let ip: string;
  // Development fallback assumes the dev server remains bound to loopback.
  // Request/Fetch does not expose the socket peer; a URL is not a transport ACL.
  const loopbackDev =
    env.NODE_ENV !== "production" &&
    !secret &&
    !proof &&
    ["localhost", "127.0.0.1", "[::1]"].includes(new URL(request.url).hostname);
  if (loopbackDev) {
    ip = "127.0.0.1";
  } else {
    // Compare fixed-length digests even when the proof has a different length.
    if (
      !secret ||
      secret.length < 32 ||
      !proof ||
      !timingSafeEqual(
        createHash("sha256").update(secret).digest(),
        createHash("sha256").update(proof).digest(),
      )
    )
      throw unavailable();
    ip = request.headers.get("x-real-ip") ?? "";
    const version = isIP(ip);
    if (!version || ip.includes("%")) throw unavailable();
    if (version === 6) ip = new URL(`http://[${ip}]/`).hostname.slice(1, -1);
  }
  const headers = new Headers(request.headers);
  for (const name of [
    "x-warrantyidea-client-ip",
    "x-warrantyidea-proxy-secret",
    "x-real-ip",
    "x-forwarded-for",
    "client-ip",
    "forwarded",
  ])
    headers.delete(name);
  headers.set("x-warrantyidea-client-ip", ip);
  return new Request(request, { headers });
}
