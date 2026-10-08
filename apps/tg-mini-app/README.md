# BM Booking Telegram Mini App

Patient portal built as a Telegram Mini App. Opens inside Telegram via the WebApp button in `tg-bot/bot.js`.

## Features

- **Login** — Phone (+251) → OTP verification (auto login for existing users, register new patients)
- **Patient Setup** — Full name, DOB, gender, blood type, emergency contact
- **Home** — Quick actions + featured doctors
- **Doctor Search** — Search by name/specialty, view detail/schedules
- **Booking** — 5-step flow: Sponsor → Date/Time → Telebirr Payment → Confirm → Success
- **Appointments** — Status-filtered list (All, Pending, Accepted, Completed, Declined)
- **Profile** — View info, logout

## File Structure

```
tg-mini-app/
├── index.html            # Entry point, loads Telegram WebApp SDK
├── server.js             # Node.js static server (SPA fallback)
├── css/styles.css        # Telegram-themed styles
├── js/
│   ├── api.js            # API client → https://bmapi.possibletechplc.com
│   ├── store.js          # localStorage for token/user
│   ├── tg.js             # Telegram WebApp SDK wrapper
│   ├── router.js         # SPA router with auth guard
│   ├── app.js            # Bootstrap
│   └── views/            # Screen views
│       ├── login.js, setup.js, home.js, doctors.js,
│       ├── booking.js, appointments.js, profile.js
├── package.json
├── Dockerfile
└── README.md
```

---

## Deploy on a VPS

### 1. Copy the files to your VPS

```bash
# From your local machine
scp -r apps/tg-mini-app/ user@your-vps-ip:/opt/bm-booking/

# Or if the repo is on the VPS already
cd /opt/bm-booking/BMBookingIntegrated
```

### 2. Start the server

```bash
cd /opt/bm-booking/BMBookingIntegrated/apps/tg-mini-app

# Option A: Node.js built-in server (no dependencies needed)
nohup node server.js > /tmp/tg-mini-app.log 2>&1 &
# Runs on port 8081 by default

# Option B: Docker
docker compose up -d tg-mini-app
```

Test it:

```bash
curl http://localhost:8081
# Should return the index.html
```

### 3. Set up SSL (required for Telegram Mini Apps)

Telegram requires HTTPS. Use nginx + certbot or Cloudflare Tunnel.

**nginx reverse proxy:**

```nginx
# /etc/nginx/sites-available/bm-mini-app
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/bm-mini-app /etc/nginx/sites-enabled/
sudo certbot --nginx -d your-domain.com
sudo systemctl reload nginx
```

**Cloudflare Tunnel (alternative, no open ports needed):**

```bash
cloudflared tunnel --url http://localhost:8081
# Gives you a https://xxx.trycloudflare.com URL
```

### 4. Connect the bot

Edit the bot's environment (`tg-bot/.env`):

```
BOT_TOKEN=8832887848:AAE4Tye7od9P9oTg8liBhzWzbNjDWDQ-ZAk
WEBAPP_URL=https://your-domain.com
```

Restart the bot:

```bash
cd /opt/bm-booking/BMBookingIntegrated/apps/tg-bot
export BOT_TOKEN="8832887848:AAE4Tye7od9P9oTg8liBhzWzbNjDWDQ-ZAk"
export WEBAPP_URL="https://your-domain.com"
nohup node bot.js > /tmp/bot.log 2>&1 &
```

### 5. Verify

Open Telegram → find your bot → tap **Open BM Booking** (or `/start`). The mini app loads inside Telegram.

---

## Quick 1-command deploy (Node.js + Cloudflare Tunnel)

```bash
cd /opt/bm-booking/BMBookingIntegrated/apps/tg-mini-app
nohup node server.js > /tmp/tg-mini-app.log 2>&1 &
nohup cloudflared tunnel --url http://localhost:8081 > /tmp/cloudflared.log 2>&1 &
# Copy the cloudflared URL into tg-bot/.env as WEBAPP_URL, restart bot
```

## API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/request-otp` | Send OTP |
| POST | `/api/auth/verify-otp` | Verify OTP, get JWT |
| GET | `/api/patients/profile` | Fetch patient profile |
| POST | `/api/patients/profile` | Create patient profile |
| GET | `/api/doctors/all` | List all doctors |
| GET | `/api/doctors/:id/schedules` | Doctor's available schedules |
| GET | `/api/appointments/categories` | Issue categories |
| GET | `/api/appointments/recommendations/:category` | Recommended documents |
| POST | `/api/appointments` | Create appointment |
| GET | `/api/appointments/my` | My appointments |
| POST | `/api/payments/verify-telebirr` | Verify Telebirr payment |

All requests go to `https://bmapi.possibletechplc.com`. Telebirr checkout opens at `https://api.bm.possibletechplc.com:8443`.
