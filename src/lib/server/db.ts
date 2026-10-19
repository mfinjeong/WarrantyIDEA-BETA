import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";
const globalDb = globalThis as unknown as { warrantyDb?: PrismaClient };
function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  return new PrismaClient({
    adapter: new PrismaPg(
      { connectionString: url, max: 10 },
      { schema: "warrantyidea" },
    ),
  });
}
export const db = (): PrismaClient => {
  if (!globalDb.warrantyDb) {
    if (typeof window !== "undefined") throw new Error("DB accessed on client");
    globalDb.warrantyDb = createDb();
  }
  return globalDb.warrantyDb;
};
if (process.env.NODE_ENV !== "production") globalDb.warrantyDb = db();
