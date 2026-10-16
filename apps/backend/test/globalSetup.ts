import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import type { TestProject } from "vitest/node";

// A throwaway in-memory Postgres (PGlite) on a local port, with the real
// migrations applied by `prisma migrate deploy`. No Postgres install needed.

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

const PORT = 55432;

export default async function setup(project: TestProject) {
  const db = await PGlite.create();
  const server = new PGLiteSocketServer({ db, port: PORT, host: "127.0.0.1", maxConnections: 4 });
  await server.start();
  const url = `postgresql://postgres:postgres@127.0.0.1:${PORT}/postgres?sslmode=disable`;

  // Async on purpose: this process also serves the database, so it must not block.
  await promisify(execFile)(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: url },
  });

  project.provide("databaseUrl", url);
  return async () => {
    await server.stop();
    await db.close();
  };
}
