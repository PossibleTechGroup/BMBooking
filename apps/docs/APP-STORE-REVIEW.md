# App Store Review — Demo Login & Submission Notes

Copy the "App Review Information" block below into **App Store Connect → App Information →
App Review Information** when uploading the build. The rest of this file is for the team.

---

## App Review Information (copy-paste for App Store Connect)

**Sign-in** (if applicable): Yes — demo account flow below.

**Contact:** abelashinework@gmail.com

**Notes to Reviewer:**

> BM Booking is strictly an appointment booking platform that connects patients with physical hospitals and clinics for real-world, in-person consultations. The app does not provide medical advice or diagnosis, and does not sell digital goods, subscriptions, or virtual consultations (Guideline 3.1.5 - Physical Goods and Services).
>
> **Reviewer login:** Tap "Login", enter phone number **912345678**, tap Continue. Enter code **123456** (or any 6-digit code) and tap Continue to be fully signed in as a patient. No SMS delivery is required.
>
> All medical appointments and hospital card registrations are utilized in the physical world at real healthcare facilities.

---

## Team checklist (do each before submitting)

- [ ] **MOCK_OTP=true on the deployed backend** — see "Enable demo OTP on the server" below.
      Without this, reviewers get a real SMS OTP they cannot receive and the app is
      rejected as "unable to log in / complete review".
- [ ] App Review build points at **production API** `https://bmbookingapi.possibletechplc.com`
      (set `EXPO_PUBLIC_API_URL` when running `eas build`); do not ship a build hardcoded
      to `localhost` or a LAN IP.
- [ ] Privacy policy URL set in App Store Connect → App Privacy (hosted at the Landing site
      `/privacy-policy`), plus App Privacy nutrition labels (health, location, photos, contact info, purchase history).
- [ ] APNs key (.p8) configured in `eas credentials` for the iOS production build.
- [ ] Screenshots 6.7" and 6.5" uploaded with readable, real content.

## How the demo login works

Backend flow (`apps/backend/src/services/auth.service.js`):

- With `MOCK_OTP=true`, `POST /api/auth/request-otp` does **not** send SMS. It returns
  `{ mockCode: "NNNNNN" }` in the JSON body (`auth.service.js:78-84`).
- The app reads `mockCode`, displays a "Dev OTP: NNNNNN" banner and auto-fills it
  (`apps/mobile/app/(auth)/login.tsx` lines ~211-215).
- Any number matching `+251[79]XXXXXXXX` works — no pre-existing account needed; verification
  auto-creates the user.

## Enable demo OTP on the server (production VPS)

Production `.env` is written by `deploy-vps.sh` with `MOCK_OTP=false`. To enable the demo flow:

```bash
ssh root@77.42.25.202
cd /opt/bmbooking
sed -i 's/^MOCK_OTP=.*/MOCK_OTP=true/' .env
docker compose up -d --build                                 # or: docker compose up -d backend
docker exec bm-backend npx prisma migrate deploy 2>/dev/null || true
docker exec bm-backend npx prisma db seed
# verify:
curl -s -X POST https://bmbookingapi.possibletechplc.com/api/auth/request-otp \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+251912345678","isRegistration":false}' | grep mockCode
```

`docker-compose.yml` defaults to `MOCK_OTP=true` (`${MOCK_OTP:-true}`), so only the server
`.env` needs changing. Revert to `false` after the review if you want real SMS delivery.

## Security note

`mockCode` is returned only when `MOCK_OTP=true`. Keep the flag off in production after
reviewing, and rotate any test phone numbers afterwards.