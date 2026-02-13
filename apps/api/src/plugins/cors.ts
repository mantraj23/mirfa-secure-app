import { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';

export async function registerCors(app: FastifyInstance) {
  app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  });
}
