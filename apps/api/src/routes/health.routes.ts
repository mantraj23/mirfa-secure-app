import { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    return {
      status: "online",
      message: "Mirfa Secure Vault API is running"
    };
  });
}
