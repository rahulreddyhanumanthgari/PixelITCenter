import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

export type Db = PrismaClient;

export function createDb(connectionString: string, maxConnections?: number): Db {
  const adapter = new PrismaPg({ connectionString, ...(maxConnections ? { max: maxConnections } : {}) });
  // No query logging: queries carry profile values.
  return new PrismaClient({ adapter, log: [] });
}
