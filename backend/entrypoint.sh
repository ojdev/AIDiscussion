#!/bin/sh
set -e

echo "🔧 Setting up database..."
npx prisma db push --accept-data-loss

echo "🚀 Starting server..."
exec node dist/server.js