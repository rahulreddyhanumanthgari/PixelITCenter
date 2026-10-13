import "dotenv/config";
import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { log } from "./lib/logger.js";
import { createDb } from "./lib/prisma.js";

const env = loadEnv();
const db = createDb(env.DATABASE_URL, env.DATABASE_POOL_MAX);
const server = createApp(env, db).listen(env.PORT, () => {
  log.info("portal api listening", { port: env.PORT, env: env.NODE_ENV, devAuth: env.DEV_AUTH_ENABLED });
});

async function shutdown() {
  server.close();
  await db.$disconnect();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
