import { createApp } from "./app.js";
import { config } from "./config.js";
import { prisma } from "./db.js";

if (!config.databaseUrl) {
  console.error("DATABASE_URL is required. Copy .env.example to .env and set the PostgreSQL connection string.");
  process.exit(1);
}

await prisma.$connect();
await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });

const app = createApp({ db: prisma, config });
const server = app.listen(config.port, () => {
  console.log(`SGCB server is running at ${config.appUrl}`);
});

async function shutdown(signal) {
  console.log(`${signal}: stopping server`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
