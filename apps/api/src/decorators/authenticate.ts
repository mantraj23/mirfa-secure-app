import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function registerAuthDecorator(app: FastifyInstance) {
  app.decorate(
    "authenticate",
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        await req.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    }
  );
}
