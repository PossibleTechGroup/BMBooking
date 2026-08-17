# Cloudflare DNS Records — possibletechplc.com

VPS IP: `157.180.114.86`

## DNS Records

| Type | Name | Content | Proxy | Notes |
|------|------|---------|-------|-------|
| `A` | `bmapi` | `157.180.114.86` | Proxied (orange cloud) | Backend API — `bmapi.possibletechplc.com` → VPS port `52400` |
| `A` | `bmtelebirr` | `157.180.114.86` | Proxied (orange cloud) | Telebirr H5 — `bmtelebirr.possibletechplc.com` → VPS port `53402` |
| `A` | `privacy-policy-bm` | `157.180.114.86` | Proxied (orange cloud) | Privacy Policy — `privacy-policy-bm.possibletechplc.com` → VPS port `80` |
| `A` | `tos-bm` | `157.180.114.86` | Proxied (orange cloud) | Terms of Service — `tos-bm.possibletechplc.com` → VPS port `80` |
| `A` | `bmadmin` | `157.180.114.86` | Proxied (orange cloud) | Admin Dashboard — `bmadmin.possibletechplc.com` → VPS port `53400` |
| `A` | `bmreception` | `157.180.114.86` | Proxied (orange cloud) | Reception — `bmreception.possibletechplc.com` → VPS port `53401` |
| `A` | `bmbookingtelegrambot` | `157.180.114.86` | Proxied (orange cloud) | Telegram Mini App — `bmbookingtelegrambot.possibletechplc.com` → VPS port `53403` (used as the bot's `WEBAPP_URL`) |

## SSL/TLS Settings (Cloudflare Dashboard)

1. Go to **SSL/TLS** → set mode to **Full (Strict)**
2. Enable **Always Use HTTPS**
3. Enable **Automatic HTTPS Rewrites**

> **Full (Strict) requires the origin nginx to serve HTTPS on port 443 with a valid
> certificate** (the wildcard cert from certbot covers `*.possibletechplc.com`). If the
> `listen 443 ssl` server blocks below are not applied, every hostname behind Cloudflare
> will either loop-redirect (`301 https://$host$request_uri`) or return a 522/526 error.
> Symptom of a broken origin:
> `curl -sI https://bmbookingtelegrambot.possibletechplc.com/` → infinite `301` to itself.
> After fixing nginx, verify:
> `curl -sI https://bmbookingtelegrambot.possibletechplc.com/` → `HTTP/2 200`.

## Nginx Config (on VPS)

```nginx
# /etc/nginx/sites-available/bm

# Backend API
server {
    listen 443 ssl;
    server_name bmapi.possibletechplc.com;

    ssl_certificate     /etc/letsencrypt/live/possibletechplc.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/possibletechplc.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:52400;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Telebirr H5
server {
    listen 443 ssl;
    server_name bmtelebirr.possibletechplc.com;

    ssl_certificate     /etc/letsencrypt/live/possibletechplc.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/possibletechplc.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:53402;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Privacy Policy (static)
server {
    listen 443 ssl;
    server_name privacy-policy-bm.possibletechplc.com;

    ssl_certificate     /etc/letsencrypt/live/possibletechplc.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/possibletechplc.com/privkey.pem;

    root /home/abel/BMBookingIntegrated/apps/landing;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}

# Terms of Service (static)
server {
    listen 443 ssl;
    server_name tos-bm.possibletechplc.com;

    ssl_certificate     /etc/letsencrypt/live/possibletechplc.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/possibletechplc.com/privkey.pem;

    root /home/abel/BMBookingIntegrated/apps/landing;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}

# Admin Dashboard
server {
    listen 443 ssl;
    server_name bmadmin.possibletechplc.com;

    ssl_certificate     /etc/letsencrypt/live/possibletechplc.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/possibletechplc.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:53400;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Reception Dashboard
server {
    listen 443 ssl;
    server_name bmreception.possibletechplc.com;

    ssl_certificate     /etc/letsencrypt/live/possibletechplc.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/possibletechplc.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:53401;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Telegram Mini App (bot WEBAPP_URL)
server {
    listen 443 ssl;
    server_name bmbookingtelegrambot.possibletechplc.com;

    ssl_certificate     /etc/letsencrypt/live/possibletechplc.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/possibletechplc.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:53403;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name *.possibletechplc.com;
    return 301 https://$host$request_uri;
}
```

## Deployment Steps

```bash
# 1. Install nginx + certbot on VPS
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx

# 2. Add all DNS records in Cloudflare first, then:
sudo certbot certonly --nginx -d possibletechplc.com -d *.possibletechplc.com

# 3. Copy the nginx config above to:
sudo nano /etc/nginx/sites-available/bm
sudo ln -sf /etc/nginx/sites-available/bm /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 4. Set up auto-renewal
sudo systemctl enable certbot.timer
```
