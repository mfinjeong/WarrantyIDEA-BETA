import { auth } from "@/lib/server/auth";
import { prepareAuthRequest } from "@/lib/server/trusted-proxy";
import { checkOrigin, jsonBody, errorResponse, fail } from "@/lib/server/http";
import { registrationInput, signInInput } from "@/lib/server/validation";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handler(request: Request) {
  try {
    checkOrigin(request);
    request = prepareAuthRequest(request);
    const path = new URL(request.url).pathname;
    const allowed = new Set([
      "/api/auth/sign-up/email",
      "/api/auth/sign-in/email",
      "/api/auth/sign-out",
      "/api/auth/get-session",
    ]);
    if (!allowed.has(path))
      return fail(404, "NOT_FOUND", "Endpoint not found.");
    if (
      request.method === "POST" &&
      ["/api/auth/sign-up/email", "/api/auth/sign-in/email"].includes(path)
    ) {
      const body = await jsonBody(request.clone());
      const parsed = (
        path.endsWith("sign-up/email") ? registrationInput : signInInput
      ).parse(body);
      if (parsed.callbackURL) {
        const url = new URL(parsed.callbackURL, process.env.BETTER_AUTH_URL);
        if (url.origin !== new URL(process.env.BETTER_AUTH_URL!).origin)
          return fail(403, "INVALID_ORIGIN", "Callback origin not allowed.");
      }
      request = new Request(request, { body: JSON.stringify(parsed) });
    }
    const response = await auth.handler(request);
    if (response.status >= 500)
      return fail(
        500,
        "INTERNAL_ERROR",
        "Authentication is temporarily unavailable.",
      );
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    // Keep diagnostics server-side and never log request bodies, cookies or DB URLs.
    const diagnostics: string[] = [];
    const visit = (value: unknown, depth = 0) => {
      if (!value || typeof value !== "object" || depth > 6) return;
      for (const [key, item] of Object.entries(value)) {
        if (key === "code" && typeof item === "string") diagnostics.push(item);
        else if (typeof item === "string") {
          for (const marker of ["self-signed certificate", "unable to verify", "certificate has expired", "hostname mismatch"])
            if (item.toLowerCase().includes(marker)) diagnostics.push(marker);
        } else if (typeof item === "object") visit(item, depth + 1);
      }
    };
    visit(error);
    console.error("Authentication request failed", {
      name: error instanceof Error ? error.name : "UnknownError", diagnostics,
    });
    return errorResponse(error);
  }
}
export { handler as GET, handler as POST };
