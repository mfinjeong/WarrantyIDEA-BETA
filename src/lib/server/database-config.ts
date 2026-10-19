import type { PoolConfig } from "pg";

export function databaseConfig(connectionString: string, ca?: string): PoolConfig {
  if (!ca) return { connectionString, max: 10 };
  const url = new URL(connectionString);
  // URL SSL parameters override pg's explicit ssl object, including its CA.
  for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert", "uselibpqcompat"])
    url.searchParams.delete(key);
  return { connectionString: url.toString(), max: 10, ssl: { ca, rejectUnauthorized: true } };
}
