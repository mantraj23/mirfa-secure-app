import Fastify from 'fastify';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { prisma } from '@repo/db';
import { encryptTransaction, decryptTransaction } from '@repo/crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// --- 1. TYPE AUGMENTATION (Fixes TS Error) ---
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

// --- 2. SERVER SETUP ---
const app = Fastify({ logger: true });
const MASTER_KEY = process.env.MASTER_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Validate Config (With clearer logging)
if (!MASTER_KEY || MASTER_KEY.length !== 64) {
  console.error("\n\n❌ ---------------------------------------------------");
  console.error("❌ CRITICAL ERROR: MASTER_KEY is invalid.");
  console.error(`❌ Expected 64 characters (32-byte hex string).`);
  console.error(`❌ Got: ${MASTER_KEY ? MASTER_KEY.length + " characters" : "Undefined"}`);
  console.error("❌ Fix: Run this command to generate a key:");
  console.error('   node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  console.error("❌ Then paste it into apps/api/.env");
  console.error("---------------------------------------------------\n");
  process.exit(1);
}

// --- 3. PLUGINS ---
// Improved CORS to allow credentials and specific headers
app.register(cors, { 
  origin: true, // Reflects the request origin (Good for dev)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
});

app.register(jwt, { secret: JWT_SECRET });

// --- 4. DECORATORS ---
app.decorate("authenticate", async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    await req.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});

// --- 5. HEALTH CHECK (New) ---
// Helps verify if the server is actually running
app.get('/', async () => {
  return { status: "online", message: "Mirfa Secure Vault API is running" };
});

// --- 6. AUTH ROUTES ---

// POST /auth/signup
app.post('/auth/signup', async (req, reply) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().optional()
  });

  try {
    const { email, password, name } = schema.parse(req.body);
    
    // Check if user exists BEFORE hashing to save CPU
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.status(400).send({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name }
    });

    // Issue Token
    const token = app.jwt.sign({ id: user.id, email: user.email });
    return { token, user: { id: user.id, email: user.email } };

  } catch (e: any) {
    req.log.error(e);
    // Return a clean error message to the frontend
    return reply.status(400).send({ error: e.message || 'Signup failed' });
  }
});

// POST /auth/login
app.post('/auth/login', async (req, reply) => {
  const { email, password } = req.body as any;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return reply.status(401).send({ error: 'Invalid credentials' });
  }

  const token = app.jwt.sign({ id: user.id, email: user.email });
  return { token, user: { id: user.id, email: user.email } };
});

// --- 7. SECURE TRANSACTION ROUTES ---

// POST /tx/encrypt (Authenticated)
app.post('/tx/encrypt', { onRequest: [app.authenticate] }, async (req, reply) => {
  const { partyId, payload } = req.body as any;
  // @ts-ignore (user attached by jwt)
  const userId = req.user.id;

  if (!partyId || !payload) return reply.status(400).send({ error: "Missing 'partyId' or 'payload'" });

  // 1. Perform Envelope Encryption
  const secureData = encryptTransaction(partyId, payload, MASTER_KEY);

  // 2. Store in DB linked to User
  const record = await prisma.secureRecord.create({
    data: {
      ...secureData,
      userId: userId
    }
  });

  return { success: true, id: record.id };
});

// GET /tx (Authenticated - List My Records)
app.get('/tx', { onRequest: [app.authenticate] }, async (req, reply) => {
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

// POST /tx/:id/decrypt (Authenticated & Authorized)
app.post('/tx/:id/decrypt', { onRequest: [app.authenticate] }, async (req, reply) => {
  // @ts-ignore
  const userId = req.user.id;
  const { id } = req.params as { id: string };

  const record = await prisma.secureRecord.findUnique({ where: { id } });

  if (!record) return reply.status(404).send({ error: "Record not found" });

  // AUTHORIZATION CHECK
  if (record.userId !== userId) {
    return reply.status(403).send({ error: "Unauthorized: You do not own this record" });
  }

  try {
    const originalPayload = decryptTransaction(record, MASTER_KEY);
    return { success: true, payload: originalPayload };
  } catch (e) {
    req.log.error(e);
    return reply.status(500).send({ error: "Decryption Integrity Failed (Tampering Detected)" });
  }
});

// --- 8. START SERVER ---
const start = async () => {
  try {
    await app.listen({ port: 3001, host: '0.0.0.0' });
    console.log(`✅ API Server running on http://localhost:3001`);
    console.log(`✅ Health check available at http://localhost:3001/`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();