# BM Booking — About This App

> Healthcare appointment booking platform for the Ethiopian market. One monorepo containing backend, web portals, dashboards, Telegram apps, and the patient/doctor mobile app.

---

## 1. What It Is

**BM Booking** connects **patients** with **doctors**, hospitals, and **medical equipment** (MRI, CT Scan, X-Ray, Dialysis, etc.). Users can:

- Find and book doctors / medical equipment at hospitals and lab centers across Ethiopia
- Pay via **Telebirr** (mobile money)
- Work in **English**, **Amharic**, and **Oromo**
- Use **Ethiopian calendar** and **Ethiopian time** (ቀን/ሌሊት) preferences

Two primary mobile roles — **Patient** and **Doctor** — each with its own onboarding, dashboard, and features. Admin/reception/hospital users work through web dashboards.

---

## 2. Monorepo Structure

```
BMBooking/
├── docker-compose.yml          # Whole stack (Docker Compose project: bm-booking)
├── .env / .env.example         # Single root env file
├── deploy-vps.sh               # VPS deploy script
├── scripts/                    # Dev & deployment scripts
├── apps/
│   ├── backend/                # Express + Prisma API (Postgres)
│   │   ├── src/                #   routes, controllers, services, middleware, models
│   │   ├── prisma/             #   schema.prisma, seed, migrations
│   │   └── telebirr-h5-integration/  # Telebirr H5 payment gateway
│   ├── web/                    # Next.js portal (patient + hospital/admin login)
│   ├── newweb/                 # Next.js portal (newer variant)
│   ├── admin-dashboard/        # Hospital admin panel (Vite + React)
│   ├── reception/              # Reception staff dashboard (Vite + React)
│   ├── mobile/                 # Expo / React Native app (patients & doctors)
│   ├── landing/                # Public landing + legal pages (Next.js)
│   ├── telegram-bot/           # Node.js Telegram bot
│   ├── tg-mini-app/            # Telegram Mini App (vanilla JS)
│   ├── db/                     # DB-related assets
│   └── docs/                   # Architecture docs, guides, API collections
└── *.md                        # Product / theme / flow docs
```

---

## 3. Services & Ports (docker-compose)

| Service | Container | Port | What it is |
|---------|-----------|------|------------|
| `backend` | `bm-backend` | 52400→5000 | Express + Prisma API |
| `db` | `bm-db` | 5433→5432 | PostgreSQL 15 |
| `admin-dashboard` | `bm-admin-dashboard` | 53400→3000 | Hospital admin panel |
| `reception` | `bm-reception` | 53401→3001 | Reception dashboard |
| `telebirr-h5` | `bm-telebirr-h5` | 53402→8080 | Telebirr H5 payment |
| `tg-mini-app` | `bm-tg-mini-app` | 53403→8081 | Telegram Mini App |
| `landing` | `bm-landing` | 53404→3002 | Landing + legal pages |
| `web` | `bm-web` | 53411→3000 | Next.js portal |
| `telegram-bot` | `bm-telegram-bot` | — | Telegram bot |

Backend container uses a **bind mount** (`./apps/backend:/usr/src/app`) running `npm run dev` (nodemon); DB and node_modules are named volumes.

---

## 4. Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express, Prisma ORM (PostgreSQL 15) |
| Mobile | React Native — Expo SDK 54 (New Architecture), Expo Router v6, Redux Toolkit, Axios, Reanimated, Maps, Notifications, SecureStore, i18next, EAS Build |
| Web / Portals | Next.js (`web`, `newweb`, `landing`), Vite + React (`admin-dashboard`, `reception`) |
| Telegram | Node.js bot + vanilla-JS Mini App |
| Payments | Telebirr H5 (mobile), Chapa (backend env) |
| Infra | Docker Compose, nginx/reverse proxy, VPS |

---

## 5. Backend

**Entry:** `apps/backend/src/server.js`. Structure: `routes/`, `controllers/`, `services/`, `middleware/`, `models/`, `config/`, `utils/`, `lib/`.

### Auth & roles
- **Patients/Doctors**: phone (+251) + **OTP** via SMS (GeezSMS), JWT bearer tokens. Flow: `request-otp` → `verify-otp`.
- **Admin / hospital / reception**: separate portal logins (`/api/admin/login`, etc.).
- Middleware checks JWT **and** account status — deleted accounts (`users.is_deleted`) get `401`.

### API areas (routes)
- `/api/auth/*` — OTP login, register, profile, **DELETE /api/auth/account (account deletion)**
- `/api/patients/*`, `/api/doctors/*`
- `/api/hospitals/*`, `/api/hospital-portal/*`
- `/api/appointments/*` (patient + doctor, stats, follow-ups, reschedule)
- `/api/equipment/*`, `/api/receptionist/*`
- `/api/reviews/*`, `/api/announcements/*`, `/api/notifications/*`
- `/api/wallet/*`, `/api/transactions/*`, `/api/withdrawals/*` (doctor wallet)
- `/api/admin/*` — users, hospitals, applications (approve/reject), analysis
- `GET /health`

### Payments
- **Telebirr H5** — external payment gateway (`telebirr-h5` service), used in the mobile booking flow.
- **Chapa** — available via `CHAPA_SECRET_KEY`.

### Background jobs
- Appointment **reminder service** (hourly check) on boot.
- Telegram bot + webhooks for notifications.

### Prisma schema (models)
`User`, `PatientProfile`, `OTP`, `Hospital`, `HospitalService`, `ReceptionistProfile`, `HospitalProfile`, `DoctorProfile`, `DoctorSchedule`, `ScheduleSlot`, `PaymentMethod`, `Appointment`, `Card`, `CardTemplate`, `ServiceFee`, `Wallet`, `Transaction`, `WithdrawalRequest`, `Notification`, `Announcement`, `MedicalEquipment`, `EquipmentAnnouncement`, `EquipmentBooking`, `Review`, `HospitalApplication`.

DB ops in production use `npx prisma db push` (no migration files at deploy time; additive schema changes are safe).

---

## 6. Mobile App (`apps/mobile`)

Expo SDK 54 app for **patients** and **doctors** — runs outside Docker. See `apps/mobile/PRODUCT.md` for the full product breakdown.

### Authentication flow
1. Enter Ethiopian phone (`+251`, 9-digit, starts 7/9) → 2. choose role if new → 3. 6-digit OTP (auto-submit).
- Session persisted in **Expo SecureStore**; Bearer token on API calls.
- **Account deletion** (added recently): Settings → Delete Account, confirm modal, backend soft-delete + anonymize (`is_deleted`/`deleted_at`), local session cleared.

### Patient features
- Home/services, Featured doctors, search + filter + GPS-distance sort
- Find Doctors, Medical Equipment (8 categories) + announcements
- Appointments (doctor + lab tabs, status filters, reschedule, cancel, rate & review)
- Multi-step booking wizard (sponsor → issue → AI recommendations → referrals → date/time → Telebirr pay → confirm)
- Profile: edit info (Ethiopian/Gregorian calendar picker), notifications, privacy toggles, time/calendar format, language, legal links, logout

### Doctor features
- Dashboard stats, day/week calendar, appointment accept/decline/complete + follow-ups
- Schedule tab (Google-calendar grid, recurring/weekly slots, share via WhatsApp/SMS/Telegram/CSV)
- Profile + performance (rating, reviews), edit professional details (photo/video uploads), availability manager

### Onboarding
- Patient: one-step profile setup
- Doctor: 3-step (professional → identity/media → weekly schedule) with review/pending/rejected states

### i18n & localization
- English / Amharic / Oromo (~200+ keys), SecureStore persistence, system auto-detect
- Ethiopian calendar + ቀን/ሌሊት time format toggles

### Env (build-time)
| Variable | Purpose | Prod value |
|----------|---------|------------|
| `EXPO_PUBLIC_API_URL` | Backend URL | `https://bmbookingapi.possibletechplc.com` |
| `EXPO_PUBLIC_TELEBIRR_URL` | Telebirr H5 URL | `https://bmtelebirr.possibletechplc.com` |
| `EXPO_PUBLIC_LOCAL_IP` | LAN dev override | — |

### Store config (`app.json`)
- Slug `bm-booking`, Android package `com.bmbooking`
- EAS project ID `81f5c76c-172a-44aa-a6ed-1e7766802fcf`, owner `mekdlawitworku`
- ⚠️ **`ios.bundleIdentifier` is missing** — iOS builds cannot be submitted until added (see §9).
- ⚠️ Google Maps API key and Firebase config are committed in `app.json`/`google-services.json`.

### EAS build profiles (`eas.json`)
`development` / `preview` / `production` (APK) / `production-aab` (Play Store AAB), `appVersionSource: remote`.

---

## 7. Web & Dashboards

- **`web` / `newweb`** (Next.js): patient + hospital/admin login (identifier-type auto-detect), hospital portal with Receptionists nav, patient view of doctors/equipment, admin analysis/medical-tools pages.
- **`admin-dashboard`** (Vite/React): hospital admin — registerations/approvals, applied hospitals.
- **`reception`** (Vite/React): reception staff — patient check-in, calendar flows (see `apps/docs/RECEPTIONIST_CALENDAR.md`).
- **`landing`** (Next.js): public site + legal (Terms/Privacy).

---

## 8. Telegram

- **`telegram-bot`** (Node.js): interacts via `BOT_TOKEN`, opens Mini App/site.
- **`tg-mini-app`** (vanilla JS): appointments, doctors, equipment views; dark/light themes live in `tg-miniapp-darktheme.md` / `tg-miniapp-lighttheme.md`.

---

## 9. Deployment & Release

### Production (VPS)
- Server: `77.42.25.202`, app checkout at `/root/work/BMBooking`, stack supplied by this repo's `docker-compose.yml` (project `bm-booking`).
- Containers live: `bm-backend`, `bm-db`, `bm-admin-dashboard`, `bm-reception`, `bm-telebirr-h5`, `bm-tg-mini-app`, `bm-web`, `bm-telegram-bot`, `bm-landing`.
- Public URLs: `bmbookingapi.possibletechplc.com` (API), `bmtelebirr.possibletechplc.com` (Telebirr).
- Backend deploys = copy changed files into `apps/backend` (bind mount → nodemon reload) + `prisma db push`. A pre-deploy backup snapshot is kept (e.g. `.deploy-backup-delete-account/`).
- ⚠️ `deploy-vps.sh` does `docker compose down -v` (destroys DB volume) + reseed — **do not run wholesale against production**.

### Mobile release (EAS)
- Build Android: `eas build --platform android --profile production` (APK) or `production-aab` (Play Store).
- EAS CLI is installed and logged in as `mekdlawitworku`; remote Android keystore is held by Expo.
- `versionCode` auto-increments from EAS (`remote` app version source).
- EAS **Update/OTA is not configured** (no channels, no `updates` block) — installs require a fresh build.

### Current release status
- Version `1.0.0`, Android package `com.bmbooking`.
- Latest release build: **versionCode 27** (APK) / **26** (AAB), built with EAS, includes the Delete Account feature.

---

## 10. Recent Major Work

1. **Store-readiness audit** (App Store/Play review risk areas found):
   - Missing iOS `bundleIdentifier` → iOS submission blocked
   - `expo-dev-client` in production dependencies
   - Missing iOS usage-description strings (camera/photo/location)
   - Health-data / privacy-policy concerns
   - Exposed keys: Google Maps API key, `google-services.json`, EAS/firebase config in repo
2. **Delete Account feature** (implemented end-to-end):
   - Backend: `users.is_deleted`/`deleted_at` (soft delete + anonymize), auth middleware 401 for deleted accounts, `DELETE /api/auth/account`.
   - Mobile: Settings → Delete Account (patient + doctor) with confirm modal; i18n keys added for all 3 languages; session cleared on success.
   - **Deployed** to production backend (5 files + `prisma db push`) and packaged into new Android builds (AAB 26, APK 27).

---

## 11. Docs Index

| Where | Covers |
|-------|--------|
| `apps/mobile/README.md`, `PRODUCT.md` | Mobile app setup & full product spec |
| `apps/backend/README.md` | Backend run/DB/API quickstart |
| `apps/docs/` | Architecture, Docker networking, DNS records, backend specs, role guides |
| `apps/docs/guides/` | User guides (appointments, reviews, OTP login, equipment, onboarding, hospital admin, doctor reviews) |
| `apps/docs/architecture/` | Backend architecture, sequence diagrams |
| `apps/backend/legal/` | TERMS.md, PRIVACY.md |
| `README.md` (root) | Monorepo quickstart |

---

*This file is a living overview — deep-dive docs live in `apps/docs/` and per-app READMEs.*