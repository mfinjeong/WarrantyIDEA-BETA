export function authOrigin() {
  const raw = process.env.BETTER_AUTH_URL;
  if (!raw) throw new Error("BETTER_AUTH_URL is required");
  const url = new URL(raw);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  )
    throw new Error("BETTER_AUTH_URL must be an origin");
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    url.protocol !== "https:" &&
    !(
      local &&
      process.env.NODE_ENV !== "production" &&
      url.protocol === "http:"
    )
  )
    throw new Error("HTTPS auth origin is required");
  return url.origin;
}
export function authSecret() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("BETTER_AUTH_SECRET must have at least 32 characters");
  return secret;
}
