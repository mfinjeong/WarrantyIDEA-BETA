/** DB-writing test safety: never accept arbitrary application credentials. */
export function isolatedDatabaseTestSkip(): string | false {
  const raw = process.env.DATABASE_URL;
  if (!raw)
    return "Isolated PostgreSQL test environment not configured; database tests skipped.";
  const url = new URL(raw);
  if (
    url.hostname !== "127.0.0.1" ||
    url.port !== "55432" ||
    url.pathname !== "/warrantyidea_test" ||
    url.searchParams.get("schema") !== "warrantyidea"
  ) {
    throw new Error(
      "Database tests refuse non-isolated DATABASE_URL; expected 127.0.0.1:55432/warrantyidea_test?schema=warrantyidea.",
    );
  }
  if (
    process.env.WARRANTYIDEA_TEST_DB_ALLOW_WRITES !== "1" &&
    process.env.ALLOW_ISOLATED_HTTP_TESTS !== "1"
  ) {
    throw new Error(
      "Database tests require WARRANTYIDEA_TEST_DB_ALLOW_WRITES=1 or ALLOW_ISOLATED_HTTP_TESTS=1.",
    );
  }
  if (!process.env.BETTER_AUTH_URL || !process.env.BETTER_AUTH_SECRET) {
    throw new Error("Isolated test auth environment is incomplete.");
  }
  return false;
}
