FROM node:20-alpine AS base
# Install OpenSSL and libc6-compat (Required for Prisma Client on Alpine)
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable

# ---------------------------------------------------------
# Stage 1: Prune the workspace
# ---------------------------------------------------------
FROM base AS pruner
WORKDIR /app
RUN npm install -g turbo
COPY . .
# Isolate 'api' and its internal dependencies (db, crypto)
RUN turbo prune --scope=api --docker

# ---------------------------------------------------------
# Stage 2: Install Dependencies & Build
# ---------------------------------------------------------
FROM base AS builder
WORKDIR /app

# Copy lockfile and package.json's from the pruned workspace
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install dependencies (frozen lockfile for stability)
RUN pnpm install --frozen-lockfile

# Copy the source code
COPY --from=pruner /app/out/full/ .

# Build the project
# This triggers 'prisma generate' via packages/db build script
# and compiles the API via apps/api build script
RUN pnpm turbo run build --filter=api...

# ---------------------------------------------------------
# Stage 3: Production Runner
# ---------------------------------------------------------
FROM base AS runner
WORKDIR /app

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify
USER fastify

# Copy the built application and node_modules (needed for Prisma Client)
COPY --from=builder --chown=fastify:nodejs /app .

# Expose the port defined in apps/api/index.ts
EXPOSE 3001

# Start the application using the helper script
CMD ["sh", "apps/api/start.sh"]