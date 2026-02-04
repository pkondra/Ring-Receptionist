import Fastify from "fastify";
import formbody from "@fastify/formbody";
import { voiceRoutes } from "./routes/voice.js";

const PORT = Number(process.env.PORT) || 3001;

async function main() {
  const app = Fastify({ logger: true });

  await app.register(formbody);
  await app.register(voiceRoutes);

  app.get("/health", async () => {
    return { status: "ok" };
  });

  await app.listen({ port: PORT, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
