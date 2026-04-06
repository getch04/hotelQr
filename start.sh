#!/bin/bash
set -e

echo "=== Hotel QR Concierge System ==="
echo ""

# Check if Docker is running for PostgreSQL
if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running. Please start Docker Desktop first."
  echo "Then run: docker compose up -d"
  exit 1
fi

# Start PostgreSQL
echo "[1/5] Starting PostgreSQL..."
docker compose up -d db
sleep 2

# Install backend dependencies
echo "[2/5] Installing backend dependencies..."
cd backend
npm install --silent

# Run Prisma migrations and seed
echo "[3/5] Setting up database..."
npx prisma migrate dev --name init --skip-generate 2>/dev/null || true
npx prisma generate
npx ts-node src/seed/seed.ts

# Install frontend dependencies
echo "[4/5] Installing frontend dependencies..."
cd ../frontend
npm install --silent

# Start both servers
echo "[5/5] Starting servers..."
echo ""
cd ../backend
npm run start:dev &
BACKEND_PID=$!

cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "==========================================="
echo "  Hotel QR Concierge is running!"
echo "==========================================="
echo ""
echo "  Sample Room 101:  http://localhost:3000/room/room-101-0000-0000-0000-000000000000"
echo "  Guest app:       http://localhost:3000/room/<roomId>"
echo "  Staff dashboard:  http://localhost:3000/staff"
echo "  Backend API:      http://localhost:3001/api"
echo ""
echo "  Staff login: admin / admin123"
echo ""
echo "  Press Ctrl+C to stop all services"
echo "==========================================="

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
  