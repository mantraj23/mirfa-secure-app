import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // We removed the 'datasources' config here.
    // Prisma will automatically pick up DATABASE_URL from your .env file.
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export * from '@prisma/client';


/*
taskkill /IM "Docker Desktop.exe" /F
taskkill /IM "com.docker.backend.exe" /F
taskkill /IM "com.docker.service" /F
wsl --shutdown
*/