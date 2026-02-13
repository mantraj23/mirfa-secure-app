import Fastify from 'fastify';
import { registerCors } from './plugins/cors.js';
import { registerJWT } from './plugins/jwt.js';
import { registerAuthDecorator } from './decorators/authenticate.js';
import { healthRoutes } from './routes/health.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { txRoutes } from './routes/tx.routes.js';

export async function buildServer() {
  const app = Fastify({ logger: true });

  await registerCors(app);
  await registerJWT(app);
  await registerAuthDecorator(app);

  await healthRoutes(app);
  await authRoutes(app);
  await txRoutes(app);

  return app;
}
