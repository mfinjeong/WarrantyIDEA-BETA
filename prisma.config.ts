import "dotenv/config";
import { defineConfig } from "prisma/config";
const migrationUrl =
  process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Generation is credential-free; migration commands require an explicit URL.
  ...(migrationUrl ? { datasource: { url: migrationUrl } } : {}),
});
