import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
const globalDb = globalThis as unknown as { warrantyDb?: PrismaClient };
function createDb() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  return new PrismaClient({
    adapter: new PrismaPg(
      { connectionString: process.env.DATABASE_URL, max: 10 },
      { schema: "warrantyidea" },
    ),
  });
}
export const db = globalDb.warrantyDb ?? createDb();
if (process.env.NODE_ENV !== "production") globalDb.warrantyDb = db;
