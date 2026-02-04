import type { FastifyInstance } from "fastify";

export async function voiceRoutes(app: FastifyInstance) {
  app.post("/voice/inbound", async (_request, reply) => {
    return reply.code(200).send({
      ok: true,
      message:
        "Voice service scaffold: inbound call handling is not configured yet.",
    });
  });

  app.post("/voice/status", async (_request, reply) => {
    return reply.code(200).send({ ok: true });
  });
}
