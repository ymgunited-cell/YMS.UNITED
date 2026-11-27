import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

export const isDbConfigured = Boolean(process.env.DATABASE_URL);

export const pool = isDbConfigured
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

let dbInstance: ReturnType<typeof drizzle<typeof schema>>;
if (pool) {
  dbInstance = drizzle(pool, { schema });
} else {
  console.warn("[AI Studio] DATABASE_URL not set — using in-memory fallback store");
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: { data?: unknown }) => d?.data ?? {},
    update: async (d: { data?: unknown }) => d?.data ?? {},
    delete: async () => ({}),
  };
  dbInstance = new Proxy(
    {},
    {
      get: (_target, prop) =>
        prop === "query"
          ? new Proxy({}, { get: () => noOp })
          : () => ({
              from: () => ({
                where: () => ({ orderBy: async () => [], then: (r: (v: unknown[]) => void) => r([]) }),
              }),
              values: () => ({ returning: async () => [] }),
            }),
    },
  ) as unknown as ReturnType<typeof drizzle<typeof schema>>;
}

export const db = dbInstance;

export * from "./schema";
