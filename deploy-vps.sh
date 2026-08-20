#!/bin/bash
set -e

echo "========================================="
echo "  BMBooking VPS Deployment Script"
echo "  VPS: 77.42.25.202"
echo "========================================="

# 1. Install Docker if not present
if ! command -v docker &> /dev/null; then
  echo "[1/6] Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
else
  echo "[1/6] Docker already installed"
fi

# 2. Install Docker Compose plugin if not present
if ! docker compose version &> /dev/null; then
  echo "[2/6] Installing Docker Compose plugin..."
  apt-get update -qq
  apt-get install -y -qq docker-compose-plugin
else
  echo "[2/6] Docker Compose already installed"
fi

# 3. Clone or pull repo
APP_DIR="/opt/bmbooking"
if [ -d "$APP_DIR/.git" ]; then
  echo "[3/6] Pulling latest code..."
  cd "$APP_DIR"
  git pull origin main
else
  echo "[3/6] Cloning repository..."
  rm -rf "$APP_DIR"
  git clone https://github.com/PossibleTechGroup/BMBooking.git "$APP_DIR"
  cd "$APP_DIR"
fi

# 4. Create .env files
echo "[4/6] Setting up environment..."

# Root .env
cat > .env << 'EOF'
NODE_ENV=production
PORT=52400
JWT_SECRET=bmbooking-production-jwt-secret-2024
OTP_SECRET=bmbooking-otp-secret
GEEZSMS_TOKEN=iRdmmzzqzhEwp4bd3ILigG6emcwHDtp7
GEEZSMS_API_URL=https://geezsms.com/api/v1
SMS_SENDER=BMBooking
MOCK_OTP=false

# Database — must match docker-compose defaults
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=bm_booking_db
DATABASE_URL=postgresql://postgres:postgres@db:5432/bm_booking_db?schema=public
EOF

# Web .env.local — leave NEXT_PUBLIC_API_URL empty so client uses /api (relative)
# and the Next.js server-side rewrites proxy to the backend
mkdir -p apps/web
cat > apps/web/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=
EOF

# 5. Build and start (remove old volumes so DB is recreated with correct credentials)
echo "[5/6] Building and starting containers..."
docker compose down -v 2>/dev/null || true
docker compose up -d --build

# 6. Wait for DB, seed, and run migrations
echo "[6/6] Waiting for database..."
sleep 10

echo "Running Prisma migrations..."
docker exec bm-backend npx prisma migrate deploy 2>/dev/null || true

echo "Seeding database..."
docker exec bm-backend npx prisma db seed

echo ""
echo "========================================="
echo "  Deployment Complete!"
echo "========================================="
echo ""
echo "  Web:    http://77.42.25.202:53411"
echo "  API:    http://77.42.25.202:52400"
echo "  Admin:  http://77.42.25.202:53400"
echo "  Reco:   http://77.42.25.202:53401"
echo ""
echo "  Default accounts:"
echo "  - Admin:     admin / admin123"
echo "  - Hospital:  +251988223344 / password123"
echo "  - Hospital:  +251923456788 / password123"
echo "  - Receptionist: selam / password123"
echo "========================================="
