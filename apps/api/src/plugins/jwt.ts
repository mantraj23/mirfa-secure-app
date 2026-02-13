import { FastifyInstance } from 'fastify';
import jwt from '@fastify/jwt';
import { JWT_SECRET } from '../config.js';

export async function registerJWT(app: FastifyInstance) {
  app.register(jwt, { secret: JWT_SECRET });
}
