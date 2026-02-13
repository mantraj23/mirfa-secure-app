import { FastifyInstance } from 'fastify';
import { prisma } from '@repo/db';
import { encryptTransaction, decryptTransaction } from '@repo/crypto';
import { MASTER_KEY } from '../config.js';

export async function txRoutes(app: FastifyInstance) {

  app.post('/tx/encrypt', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { partyId, payload } = req.body as any;
    // @ts-ignore
    const userId = req.user.id;

    if (!partyId || !payload) {
      return reply.status(400).send({ error: "Missing 'partyId' or 'payload'" });
    }

    const secureData = encryptTransaction(partyId, payload, MASTER_KEY!);

    const record = await prisma.secureRecord.create({
      data: {
        ...secureData,
        userId
      }
    });

    return { success: true, id: record.id };
  });

  app.get('/tx', { onRequest: [app.authenticate] }, async (req) => {
    // @ts-ignore
    const userId = req.user.id;

    const records = await prisma.secureRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        partyId: true,
        createdAt: true,
        payload_ct: true
      }
    });

    return records;
  });

  app.post('/tx/:id/decrypt', { onRequest: [app.authenticate] }, async (req, reply) => {
    // @ts-ignore
    const userId = req.user.id;
    const { id } = req.params as { id: string };

    const record = await prisma.secureRecord.findUnique({ where: { id } });

    if (!record) return reply.status(404).send({ error: "Record not found" });

    if (record.userId !== userId) {
      return reply.status(403).send({ error: "Unauthorized" });
    }

    try {
      const payload = decryptTransaction(record, MASTER_KEY!);
      return { success: true, payload };
    } catch {
      return reply.status(500).send({ error: "Decryption failed" });
    }
  });
}
