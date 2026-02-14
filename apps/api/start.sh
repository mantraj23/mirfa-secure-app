#!/bin/sh
set -e

# Navigate to the database package
cd packages/db

# Check if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "🚀 Syncing database schema (db push)..."
  # Use db push instead of migrate deploy
  # --accept-data-loss allows it to run non-interactively if there are changes
  npx prisma db push --accept-data-loss
else
  echo "⚠️  DATABASE_URL not found, skipping DB sync."
fi

# Navigate back to root
cd ../../

# Start the Fastify server
echo "⚡ Starting API on port 3001..."
node apps/api/dist/index.js