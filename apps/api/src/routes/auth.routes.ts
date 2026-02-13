import { FastifyInstance } from 'fastify';
import { prisma } from '@repo/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

export async function authRoutes(app: FastifyInstance) {

  app.post('/auth/signup', async (req, reply) => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().optional()
    });

    try {
      const { email, password, name } = schema.parse(req.body);

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return reply.status(400).send({ error: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: { email, password: hashedPassword, name }
      });

      const token = app.jwt.sign({ id: user.id, email: user.email });

      return { token, user: { id: user.id, email: user.email } };

    } catch (e: any) {
      return reply.status(400).send({ error: e.message });
    }
  });

  app.post('/auth/login', async (req, reply) => {
    const { email, password } = req.body as any;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const token = app.jwt.sign({ id: user.id, email: user.email });

    return { token, user: { id: user.id, email: user.email } };
  });
}
