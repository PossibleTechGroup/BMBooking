# BM Booking API — Postman Collection & Reference

Real, import-ready API documentation for **BM Booking** (weleba.tech / possibletechplc.com).
This document is generated from the actual backend source in `apps/backend/src` (routes +
controllers), so every request body and response here matches the real API contract.

- **Repo:** `apps/backend/src/server.js` mounts every route under `/api`.
- **Base URL:** `{{baseUrl}}` → `http://localhost:5000` (prod: `https://api.weleba.tech`)
- **Postman import:** use `bm-booking-openapi.json` (same folder) → *Postman → Import → OpenAPI*,
  or import the generated collection `bm-booking-collection.json`.
- **Postman environment variables**
  | Variable | Used by |
  |---|---|
  | `baseUrl` | every request |
  | `patientToken` | Patient-flow requests |
  | `doctorToken` | Doctor-flow requests |
  | `adminToken` | Admin requests |
  | `hospitalToken` | Hospital portal requests |
  | `receptionistToken` | Receptionist requests |
  | `txRef` | payment verification |

## Authentication

Every protected route expects a JWT in the `Authorization: Bearer <token>` header.
Tokens are obtained from OTP verification (`POST /api/auth/verify-otp`), the admin login
(`POST /api/admin/login`), or the hospital/receptionist login endpoints.

### Roles & tokens
| Role | Login endpoint | Postman variable |
|---|---|---|
| Patient | `POST /api/auth/verify-otp` with `role: patient` | `{{patientToken}}` |
| Doctor | `POST /api/auth/verify-otp` with `role: doctor` | `{{doctorToken}}` |
| Admin | `POST /api/admin/login` | `{{adminToken}}` |
| Hospital owner/staff | `POST /api/auth/hospital-portal-login` | `{{hospitalToken}}` |
| Receptionist | `POST /api/auth/receptionist-login` | `{{receptionistToken}}` |

### Response envelope
All JSON endpoints return:
```json
{ "status": "success" | "fail" | "error", "data": ..., "message": "..." }
```
- 2xx success → `status: "success"` with `data` (or `message`).
- Expected client error → `4xx` with `status: "fail"` + `message`.
- Server error → `5xx` with `status: "error"` + `message`.

### Factor highlights (from the source)
- **Phone format:** Ethiopian numbers, `+251[79]XXXXXXXX` (normalized automatically).
- **OTP:** 6-digit, 5-minute expiry; 5 wrong attempts → account locked 30 minutes; codes are single-use.
- **Payments:** a fee-bearing appointment/equipment booking requires a matched Telebirr payment of the exact
  amount (verified server-side) before it is created.
- **Reviews:** only possible against a `completed` appointment that belongs to you.

---

## Endpoint index

| # | Method | Path | Auth |
|---|---|---|---|
| 1 | POST | `/api/auth/request-otp` | None |
| 2 | POST | `/api/auth/verify-otp` | None |
| 3 | POST | `/api/auth/receptionist-login` | None |
| 4 | POST | `/api/auth/hospital-login` | None |
| 5 | POST | `/api/auth/hospital-portal-login` | None |
| 6 | POST | `/api/auth/push-token` | Bearer (Patient) |
| 7 | DELETE | `/api/auth/account` | Bearer (Patient) |
| 8 | GET | `/api/doctors/all` | None |
| 9 | GET | `/api/doctors/search` | None |
| 10 | GET | `/api/doctors/{id}/schedules` | None |
| 11 | GET | `/api/doctors/profile` | Bearer (Doctor) |
| 12 | POST | `/api/doctors/profile` | Bearer (Doctor) |
| 13 | PUT | `/api/doctors/profile` | Bearer (Doctor) |
| 14 | PUT | `/api/doctors/availability` | Bearer (Doctor) |
| 15 | POST | `/api/doctors/schedules` | Bearer (Doctor) |
| 16 | GET | `/api/patients/profile` | Bearer (Patient) |
| 17 | POST | `/api/patients/profile` | Bearer (Patient) |
| 18 | POST | `/api/patients/check-phone` | Bearer (Patient) |
| 19 | GET | `/api/appointments/categories` | None |
| 20 | GET | `/api/appointments/recommendations/{category}` | None |
| 21 | POST | `/api/appointments` | Bearer (Patient) |
| 22 | POST | `/api/appointments/upload` | Bearer (Patient) |
| 23 | GET | `/api/appointments/my` | Bearer (Patient) |
| 24 | PATCH | `/api/appointments/{id}/cancel` | Bearer (Patient) |
| 25 | PATCH | `/api/appointments/{id}/reschedule` | Bearer (Patient) |
| 26 | GET | `/api/appointments/doctor` | Bearer (Doctor) |
| 27 | GET | `/api/appointments/doctor/calendar` | Bearer (Doctor) |
| 28 | GET | `/api/appointments/doctor/export` | Bearer (Doctor) |
| 29 | GET | `/api/appointments/doctor/stats` | Bearer (Doctor) |
| 30 | PATCH | `/api/appointments/{id}/accept` | Bearer (Doctor) |
| 31 | PATCH | `/api/appointments/{id}/decline` | Bearer (Doctor) |
| 32 | PATCH | `/api/appointments/{id}/complete` | Bearer (Doctor) |
| 33 | POST | `/api/appointments/{id}/follow-up` | Bearer (Doctor) |
| 34 | GET | `/api/equipment/search` | None |
| 35 | GET | `/api/equipment/categories` | None |
| 36 | GET | `/api/equipment/hospital/{id}` | None |
| 37 | GET | `/api/equipment/detail/{id}` | None |
| 38 | GET | `/api/equipment/announcements` | None |
| 39 | GET | `/api/equipment/{id}/availability` | None |
| 40 | POST | `/api/equipment/book` | Bearer (Patient) |
| 41 | GET | `/api/equipment/bookings` | Bearer (Patient) |
| 42 | PATCH | `/api/equipment/bookings/{id}/cancel` | Bearer (Patient) |
| 43 | PATCH | `/api/equipment/bookings/{id}/reschedule` | Bearer (Patient) |
| 44 | POST | `/api/payments/initialize` | Bearer (Patient) |
| 45 | GET | `/api/payments/verify/{txRef}` | None |
| 46 | GET | `/api/payments/success-redirect` | None |
| 47 | POST | `/api/payments/webhook` | None |
| 48 | POST | `/api/payments/telebirr-notify` | None |
| 49 | POST | `/api/payments/verify-telebirr` | Bearer (Patient) |
| 50 | GET | `/api/wallet` | Bearer (Doctor) |
| 51 | POST | `/api/wallet/withdraw` | Bearer (Doctor) |
| 52 | GET | `/api/payment-methods` | Bearer (Doctor) |
| 53 | POST | `/api/payment-methods` | Bearer (Doctor) |
| 54 | DELETE | `/api/payment-methods/{id}` | Bearer (Doctor) |
| 55 | PATCH | `/api/payment-methods/{id}/primary` | Bearer (Doctor) |
| 56 | GET | `/api/reviews/doctor/{id}` | None |
| 57 | GET | `/api/reviews/hospital/{id}` | None |
| 58 | POST | `/api/reviews` | Bearer (Patient) |
| 59 | GET | `/api/hospitals` | None |
| 60 | GET | `/api/hospitals/search` | None |
| 61 | GET | `/api/hospitals/{id}` | None |
| 62 | GET | `/api/notifications` | Bearer (Patient) |
| 63 | GET | `/api/notifications/unread-count` | Bearer (Patient) |
| 64 | PATCH | `/api/notifications/read-all` | Bearer (Patient) |
| 65 | PATCH | `/api/notifications/{id}/read` | Bearer (Patient) |
| 66 | DELETE | `/api/notifications/{id}` | Bearer (Patient) |
| 67 | GET | `/api/announcements` | Bearer (Patient) |
| 68 | POST | `/api/hospital-applications` | None |
| 69 | POST | `/api/telegram/verify` | None |
| 70 | POST | `/api/admin/login` | None |
| 71 | POST | `/api/admin/create` | Bearer (Admin) |
| 72 | GET | `/api/admin/doctors` | Bearer (Admin) |
| 73 | GET | `/api/admin/doctors/pending` | Bearer (Admin) |
| 74 | GET | `/api/admin/doctors/{id}` | Bearer (Admin) |
| 75 | POST | `/api/admin/doctors` | Bearer (Admin) |
| 76 | POST | `/api/admin/doctors/review` | Bearer (Admin) |
| 77 | POST | `/api/admin/doctors/schedules` | Bearer (Admin) |
| 78 | GET | `/api/admin/doctors/{id}/schedules` | Bearer (Admin) |
| 79 | DELETE | `/api/admin/doctors/schedules/{id}` | Bearer (Admin) |
| 80 | PUT | `/api/admin/doctors/{id}` | Bearer (Admin) |
| 81 | DELETE | `/api/admin/doctors/{id}` | Bearer (Admin) |
| 82 | PUT | `/api/admin/doctors/{id}/assign-hospital` | Bearer (Admin) |
| 83 | GET | `/api/admin/hospitals/{id}/doctors` | Bearer (Admin) |
| 84 | PUT | `/api/admin/doctors/{id}/fee` | Bearer (Admin) |
| 85 | GET | `/api/admin/patients` | Bearer (Admin) |
| 86 | GET | `/api/admin/patients/{id}/history` | Bearer (Admin) |
| 87 | GET | `/api/admin/stats/summary` | Bearer (Admin) |
| 88 | GET | `/api/admin/stats/patient-growth` | Bearer (Admin) |
| 89 | GET | `/api/admin/stats/active-patients` | Bearer (Admin) |
| 90 | GET | `/api/admin/stats/appointments` | Bearer (Admin) |
| 91 | GET | `/api/admin/stats/staff-performance` | Bearer (Admin) |
| 92 | GET | `/api/admin/stats/equipment-utilization` | Bearer (Admin) |
| 93 | GET | `/api/admin/analytics` | Bearer (Admin) |
| 94 | GET | `/api/admin/hospitals` | Bearer (Admin) |
| 95 | POST | `/api/admin/hospitals` | Bearer (Admin) |
| 96 | PUT | `/api/admin/hospitals/{id}` | Bearer (Admin) |
| 97 | DELETE | `/api/admin/hospitals/{id}` | Bearer (Admin) |
| 98 | PUT | `/api/admin/hospitals/{id}/service-fee` | Bearer (Admin) |
| 99 | GET | `/api/admin/receptionists` | Bearer (Admin) |
| 100 | POST | `/api/admin/receptionists` | Bearer (Admin) |
| 101 | PUT | `/api/admin/receptionists/{id}` | Bearer (Admin) |
| 102 | DELETE | `/api/admin/receptionists/{id}` | Bearer (Admin) |
| 103 | GET | `/api/admin/withdrawals` | Bearer (Admin) |
| 104 | POST | `/api/admin/withdrawals/{id}/complete` | Bearer (Admin) |
| 105 | POST | `/api/admin/equipment` | Bearer (Admin) |
| 106 | POST | `/api/admin/equipment/bulk` | Bearer (Admin) |
| 107 | PUT | `/api/admin/equipment/{id}` | Bearer (Admin) |
| 108 | DELETE | `/api/admin/equipment/{id}` | Bearer (Admin) |
| 109 | POST | `/api/admin/equipment/announce` | Bearer (Admin) |
| 110 | GET | `/api/admin/equipment-bookings` | Bearer (Admin) |
| 111 | GET | `/api/admin/hospital-applications` | Bearer (Admin) |
| 112 | PATCH | `/api/admin/hospital-applications/{id}` | Bearer (Admin) |
| 113 | GET | `/api/admin/hospital-registrations` | Bearer (Admin) |
| 114 | PATCH | `/api/admin/hospital-registrations/{id}` | Bearer (Admin) |
| 115 | POST | `/api/admin/announcements` | Bearer (Admin) |
| 116 | PUT | `/api/admin/announcements/{id}` | Bearer (Admin) |
| 117 | DELETE | `/api/admin/announcements/{id}` | Bearer (Admin) |
| 118 | PATCH | `/api/admin/announcements/{id}/publish` | Bearer (Admin) |
| 119 | POST | `/api/admin/announcements/{id}/resend` | Bearer (Admin) |
| 120 | POST | `/api/hospital/register` | None |
| 121 | GET | `/api/hospital/me` | Bearer (Hospital Portal owner/staff) |
| 122 | GET | `/api/hospital/profile` | Bearer (Hospital Portal owner/staff) |
| 123 | PATCH | `/api/hospital/profile` | Bearer (Hospital Portal owner/staff) |
| 124 | GET | `/api/hospital/stats` | Bearer (Hospital Portal owner/staff) |
| 125 | GET | `/api/hospital/overview` | Bearer (Hospital Portal owner/staff) |
| 126 | GET | `/api/hospital/appointments` | Bearer (Hospital Portal owner/staff) |
| 127 | GET | `/api/hospital/doctors` | Bearer (Hospital Portal owner/staff) |
| 128 | POST | `/api/hospital/doctors/register` | Bearer (Hospital Portal owner/staff) |
| 129 | PATCH | `/api/hospital/doctors/{id}/status` | Bearer (Hospital Portal owner/staff) |
| 130 | GET | `/api/hospital/schedules` | Bearer (Hospital Portal owner/staff) |
| 131 | PATCH | `/api/hospital/appointments/{id}/approve` | Bearer (Hospital Portal owner/staff) |
| 132 | POST | `/api/hospital/equipment` | Bearer (Hospital Portal owner/staff) |
| 133 | GET | `/api/hospital/equipment-bookings` | Bearer (Hospital Portal owner/staff) |
| 134 | PATCH | `/api/hospital/equipment-bookings/{id}/confirm` | Bearer (Hospital Portal owner/staff) |
| 135 | POST | `/api/hospital/card-templates` | Bearer (Hospital Portal owner/staff) |
| 136 | POST | `/api/hospital/cards` | Bearer (Hospital Portal owner/staff) |
| 137 | GET | `/api/hospital/staff` | Bearer (Hospital Portal owner/staff) |
| 138 | POST | `/api/hospital/staff` | Bearer (Hospital Portal owner/staff) |
| 139 | GET | `/api/receptionist/stats/dashboard` | Bearer (Receptionist) |
| 140 | GET | `/api/receptionist/hospital` | Bearer (Receptionist) |
| 141 | PATCH | `/api/receptionist/hospital/card-price` | Bearer (Receptionist) |
| 142 | GET | `/api/receptionist/patients` | Bearer (Receptionist) |
| 143 | GET | `/api/receptionist/patients/directory` | Bearer (Receptionist) |
| 144 | POST | `/api/receptionist/patients` | Bearer (Receptionist) |
| 145 | GET | `/api/receptionist/patients/{id}/history` | Bearer (Receptionist) |
| 146 | GET | `/api/receptionist/doctors` | Bearer (Receptionist) |
| 147 | POST | `/api/receptionist/doctors/register` | Bearer (Receptionist) |
| 148 | PATCH | `/api/receptionist/doctors/{id}/review` | Bearer (Receptionist) |
| 149 | GET | `/api/receptionist/equipment` | Bearer (Receptionist) |
| 150 | POST | `/api/receptionist/equipment` | Bearer (Receptionist) |
| 151 | GET | `/api/receptionist/schedules` | Bearer (Receptionist) |
| 152 | POST | `/api/receptionist/schedules` | Bearer (Receptionist) |
| 153 | GET | `/api/receptionist/appointments/upcoming` | Bearer (Receptionist) |
| 154 | PATCH | `/api/receptionist/appointments/{id}/approve` | Bearer (Receptionist) |
| 155 | PATCH | `/api/receptionist/appointments/{id}/deny` | Bearer (Receptionist) |
| 156 | POST | `/api/receptionist/equipment-bookings` | Bearer (Receptionist) |
| 157 | GET | `/api/receptionist/equipment-bookings` | Bearer (Receptionist) |
| 158 | POST | `/api/receptionist/card-templates` | Bearer (Receptionist) |
| 159 | POST | `/api/receptionist/cards` | Bearer (Receptionist) |
| 160 | PATCH | `/api/receptionist/appointments/reorder` | Bearer (Receptionist) |
| 161 | GET | `/api/legal/privacy` | None |
| 162 | GET | `/api/legal/terms` | None |

---

## Auth

### POST `/api/auth/request-otp` 

**Request OTP** — Send a 6-digit verification code to an Ethiopian phone number. With MOCK_OTP=true the demo code is returned in mockCode. Existing users do not need a role; new users must pass role.

- **Auth:** None
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/auth/request-otp
Content-Type: application/json

{
  "phone": "+251911223344",
  "role": "doctor",
  "isRegistration": true
}
```

**Sample responses**

`200` — OTP sent (mock mode returns the code)

```json
{
  "status": "success",
  "message": "OTP sent successfully",
  "mockCode": "482913"
}
```

`400` — Already registered

```json
{
  "status": "fail",
  "message": "This phone number is already registered. Please log in instead."
}
```

### POST `/api/auth/verify-otp` 

**Verify OTP** — Verify the OTP code and obtain a JWT token (valid 90 days). Stores the token in {{patientToken}}/{{doctorToken}}.

- **Auth:** None
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/auth/verify-otp
Content-Type: application/json

{
  "phone": "+251911223344",
  "code": "482913",
  "role": "doctor",
  "isRegistration": true
}
```

**Sample responses**

`200` — Login success — token + user

```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDIsInBob25lIjoiKzI1MTkxMTIyMzM0NCIsInJvbGUiOiJkb2N0b3IiLCJpYXQiOjE3MzAwMDAwMDAsImV4cCI6MTc5MDI1MjQwMH0.aaaBbBcCc",
    "user": {
      "id": 42,
      "phone": "+251911223344",
      "role": "doctor",
      "isLocked": false,
      "createdAt": "2026-09-20T08:12:33.000Z"
    }
  }
}
```

`400` — Invalid OTP / locked / reused

```json
{
  "status": "fail",
  "message": "Invalid OTP"
}
```

### POST `/api/auth/receptionist-login` 

**Receptionist Login** — Login for receptionist staff (username + password).

- **Auth:** None
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/auth/receptionist-login
Content-Type: application/json

{
  "username": "r_kirkos",
  "password": "Reception@2026"
}
```

**Sample responses**

`200` — Login success

```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjIsInVzZXJuYW1lIjoicl9raXJrb3MiLCJyb2xlIjoicmVjZXB0aW9uaXN0IiwiaG9zcGl0YWxJZCI6MywiaWF0IjoxNzMwMDAwMDAwfQ.aaaBbBcCc",
    "user": {
      "id": 22,
      "username": "r_kirkos",
      "role": "receptionist",
      "hospitalRole": "staff",
      "hospitalId": 3,
      "permissions": [
        "appointments.view",
        "patients.create"
      ]
    }
  }
}
```

`400` — Bad credentials

```json
{
  "status": "fail",
  "message": "Invalid username or password"
}
```

### POST `/api/auth/hospital-login` 

**Hospital Login** — Legacy hospital owner login (phone + password).

- **Auth:** None
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/auth/hospital-login
Content-Type: application/json

{
  "phone": "+251911223344",
  "password": "Hospital@2026"
}
```

**Sample responses**

`200` — Login success

```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 3,
      "phone": "+251911223344",
      "role": "hospital",
      "hospitalRole": "owner",
      "hospitalId": 3
    }
  }
}
```

### POST `/api/auth/hospital-portal-login` 

**Hospital Portal Login** — Unified login for the hospital portal. identifier can be a phone number, username, or email. Works for owners (role hospital) and staff (role receptionist).

- **Auth:** None
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/auth/hospital-portal-login
Content-Type: application/json

{
  "identifier": "admin@kirkos-hospital.com",
  "password": "Hospital@2026"
}
```

**Sample responses**

`200` — Portal login success

```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 3,
      "phone": "+251911223344",
      "role": "hospital",
      "hospitalRole": "owner",
      "hospitalId": 3,
      "permissions": [
        "*"
      ]
    }
  }
}
```

### POST `/api/auth/push-token` 🔒

**Register Push Token** — Register an Expo push token so the user receives push notifications.

- **Auth:** Bearer (Patient)
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/auth/push-token
Authorization: Bearer {{patientToken}}
Content-Type: application/json

{
  "token": "ExponentPushToken[xxxx-xxxx-xxxx-xxxx]"
}
```

**Sample responses**

`200` — OK

```json
{
  "status": "success",
  "message": "Push token registered"
}
```

### DELETE `/api/auth/account` 🔒

**Delete My Account** — Soft-deletes the account and anonymizes personal data (App Store / Play requirement). Releases the phone number.

- **Auth:** Bearer (Patient)
- **Body:** None

**Request**

```http
DELETE {{baseUrl}}/api/auth/account
Authorization: Bearer {{patientToken}}
```

**Sample responses**

`200` — Deleted

```json
{
  "status": "success",
  "message": "Account deleted successfully",
  "data": {
    "id": 42,
    "deletedAt": "2026-09-21T10:00:00.000Z"
  }
}
```

## Doctors

### GET `/api/doctors/all` 

**List All Doctors** — Public — all approved doctors with availability and hospital info.

- **Auth:** None
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/doctors/all
```

**Sample responses**

`200` — Doctor list

```json
{
  "status": "success",
  "data": [
    {
      "id": 12,
      "userId": 42,
      "fullName": "Dr. Abel Tesfaye",
      "profilePicture": "https://res.cloudinary.com/xxx/image/upload/v1/doctor_profiles/ab.jpg",
      "specialization": "Cardiology",
      "specializations": [
        "Cardiology",
        "Internal Medicine"
      ],
      "licenseNumber": "LC-123456",
      "experienceYears": 10,
      "bio": "Consultant cardiologist with 10 years of experience.",
      "clinicName": "Kirkos Heart Center",
      "clinicAddress": "Bole Road, Addis Ababa",
      "languages": [
        "Amharic",
        "English"
      ],
      "baseHourlyRate": 500,
      "status": "Approved",
      "rating": 4.8,
      "totalReviews": 23,
      "hospital": {
        "id": 3,
        "name": "Kirkos General Hospital",
        "address": "Kirkos, Addis Ababa",
        "image": "https://res.cloudinary.com/xxx/.../hospitals/kirkos.jpg",
        "latitude": 9.0108,
        "longitude": 38.7612
      },
      "availability": {
        "isAvailable": true,
        "nextAvailableSlot": "2026-09-22T06:30:00.000Z"
      },
      "createdAt": "2026-08-01T09:00:00.000Z"
    }
  ]
}
```

### GET `/api/doctors/search` 

**Search Doctors** — Public — search/filter doctors.

- **Auth:** None
- **Body:** None
- **Query params:** `specialty` e.g. `Cardiology`; `minRating` e.g. `4.0`; `name` e.g. `Abel`

**Request**

```http
GET {{baseUrl}}/api/doctors/search
```

**Sample responses**

`200` — Search result

```json
{
  "status": "success",
  "data": []
}
```

### GET `/api/doctors/{id}/schedules` 

**Get Doctor Schedules** — Public — schedules for a doctor with optional date range filters.

- **Auth:** None
- **Body:** None
- **Path params:** `id` (integer) — Doctor profile ID
- **Query params:** `date` e.g. `2026-09-25`; `from` e.g. `2026-09-25T06:00:00.000Z`; `to` e.g. `2026-09-25T18:00:00.000Z`

**Request**

```http
GET {{baseUrl}}/api/doctors/{id}/schedules
```

**Sample responses**

`200` — Schedule list with slots

```json
{
  "status": "success",
  "data": [
    {
      "id": 301,
      "doctorId": 12,
      "date": "2026-09-25T00:00:00.000Z",
      "startTime": "2026-09-25T06:00:00.000Z",
      "endTime": "2026-09-25T12:00:00.000Z",
      "slotDuration": 30,
      "maxPatientsPerSlot": 1,
      "clinicRoom": "Room 204",
      "isActive": true,
      "slots": [
        {
          "id": 4101,
          "startTime": "2026-09-25T06:00:00.000Z",
          "endTime": "2026-09-25T06:30:00.000Z",
          "maxPatients": 1
        }
      ]
    }
  ]
}
```

### GET `/api/doctors/profile` 🔒

**Get My Doctor Profile** — Get the authenticated doctor's profile.

- **Auth:** Bearer (Doctor)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/doctors/profile
Authorization: Bearer {{doctorToken}}
```

**Sample responses**

`200` — Profile

```json
{
  "status": "success",
  "data": {
    "id": 12,
    "userId": 42,
    "fullName": "Dr. Abel Tesfaye",
    "profilePicture": null,
    "introVideo": null,
    "specialization": "Cardiology",
    "specializations": [
      "Cardiology"
    ],
    "licenseNumber": "LC-123456",
    "experienceYears": 10,
    "bio": "Consultant cardiologist with 10 years of experience.",
    "clinicName": "Kirkos Heart Center",
    "clinicAddress": "Bole Road, Addis Ababa",
    "languages": [
      "Amharic",
      "English"
    ],
    "baseHourlyRate": 500,
    "status": "PendingReview",
    "rating": 0,
    "totalReviews": 0,
    "hospitalId": null,
    "availability": [],
    "createdAt": "2026-09-20T08:15:00.000Z"
  }
}
```

### POST `/api/doctors/profile` 🔒

**Setup Doctor Profile** — Complete registration by uploading the doctor profile (multipart/form-data). profilePicture and introVideo are file fields.

- **Auth:** Bearer (Doctor)
- **Body:** multipart/form-data

**Request**

```http
POST {{baseUrl}}/api/doctors/profile
Authorization: Bearer {{doctorToken}}
 

# multipart/form-data
#   fullName: Dr. Abel Tesfaye
#   specialization: Cardiology
#   specializations: ["Cardiology","Internal Medicine"]
#   experienceYears: 10
#   bio: Consultant cardiologist with 10 years of experience.
#   clinicName: Kirkos Heart Center
#   clinicAddress: Bole Road, Addis Ababa
#   languages: ["Amharic","English"]
#   licenseNumber: LC-123456
#   baseHourlyRate: 500
#   profilePicture: (file) photo.jpg
#   introVideo: (file) intro.mp4
```


> HTTP body should be `multipart/form-data`. File fields are marked `(file)`.

**Sample responses**

`200` — Profile created

```json
{
  "status": "success",
  "data": {
    "id": 12,
    "userId": 42,
    "fullName": "Dr. Abel Tesfaye",
    "profilePicture": "https://res.cloudinary.com/xxx/.../doctor_profiles/ab.jpg",
    "status": "PendingReview"
  }
}
```

### PUT `/api/doctors/profile` 🔒

**Update Doctor Profile** — Update profile (multipart/form-data).

- **Auth:** Bearer (Doctor)
- **Body:** multipart/form-data

**Request**

```http
PUT {{baseUrl}}/api/doctors/profile
Authorization: Bearer {{doctorToken}}
 

# multipart/form-data
#   bio: Updated bio.
#   profilePicture: (file) new-photo.jpg
```


> HTTP body should be `multipart/form-data`. File fields are marked `(file)`.

**Sample responses**

`200` — Profile updated

```json
{
  "status": "success",
  "data": {
    "id": 12
  }
}
```

### PUT `/api/doctors/availability` 🔒

**Update Availability** — Set the doctor's recurring weekly availability.

- **Auth:** Bearer (Doctor)
- **Body:** JSON

**Request**

```http
PUT {{baseUrl}}/api/doctors/availability
Authorization: Bearer {{doctorToken}}
Content-Type: application/json

{
  "availability": [
    {
      "day": "monday",
      "startTime": "08:00",
      "endTime": "12:00",
      "location": "Kirkos Heart Center"
    },
    {
      "day": "wednesday",
      "startTime": "14:00",
      "endTime": "17:00",
      "location": "Clinic B"
    }
  ]
}
```

**Sample responses**

`200` — Updated

```json
{
  "status": "success",
  "data": {
    "id": 12
  }
}
```

### POST `/api/doctors/schedules` 🔒

**Create Doctor Schedule** — Create a schedule for a specific date/time window with generated slots.

- **Auth:** Bearer (Doctor)
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/doctors/schedules
Authorization: Bearer {{doctorToken}}
Content-Type: application/json

{
  "date": "2026-09-25",
  "startTime": "2026-09-25T06:00:00.000Z",
  "endTime": "2026-09-25T09:00:00.000Z",
  "slotDuration": 30,
  "maxPatientsPerSlot": 1,
  "clinicRoom": "Room 204",
  "notes": "Morning clinic"
}
```

**Sample responses**

`201` — Schedule created

```json
{
  "status": "success",
  "data": {
    "id": 301,
    "doctorId": 12,
    "isActive": true
  }
}
```

## Patients

### GET `/api/patients/profile` 🔒

**Get My Patient Profile** — Get the authenticated patient profile.

- **Auth:** Bearer (Patient)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/patients/profile
Authorization: Bearer {{patientToken}}
```

**Sample responses**

`200` — Profile

```json
{
  "status": "success",
  "data": {
    "id": 9,
    "userId": 41,
    "fullName": "Sara Alemu",
    "dateOfBirth": "1995-04-12",
    "gender": "female",
    "bloodType": "O+",
    "emergencyContact": "+251911555666",
    "createdAt": "2026-09-19T07:30:00.000Z"
  }
}
```

`404` — Not set up yet

```json
{
  "status": "fail",
  "message": "Patient profile not found"
}
```

### POST `/api/patients/profile` 🔒

**Setup / Update Patient Profile** — Create or update the patient profile.

- **Auth:** Bearer (Patient)
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/patients/profile
Authorization: Bearer {{patientToken}}
Content-Type: application/json

{
  "fullName": "Sara Alemu",
  "gender": "female",
  "dateOfBirth": "1995-04-12",
  "bloodType": "O+",
  "emergencyContact": "+251911555666"
}
```

**Sample responses**

`200` — Saved

```json
{
  "status": "success",
  "data": {
    "id": 9,
    "userId": 41,
    "fullName": "Sara Alemu",
    "gender": "female",
    "dateOfBirth": "1995-04-12",
    "bloodType": "O+",
    "emergencyContact": "+251911555666"
  }
}
```

### POST `/api/patients/check-phone` 🔒

**Check Phone (Book for Someone Else)** — Check whether a phone number already belongs to a patient before booking for someone else.

- **Auth:** Bearer (Patient)
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/patients/check-phone
Authorization: Bearer {{patientToken}}
Content-Type: application/json

{
  "phone": "+251999887766"
}
```

**Sample responses**

`200` — Existing patient

```json
{
  "status": "success",
  "data": {
    "exists": true,
    "patient": {
      "fullName": "Kebede Haile",
      "gender": "male",
      "dateOfBirth": "1980-01-01",
      "bloodType": "B+"
    },
    "registeredByMe": false
  }
}
```

`200` — Not registered yet

```json
{
  "status": "success",
  "data": {
    "exists": false
  }
}
```

## Appointments — Patient

### GET `/api/appointments/categories` 

**Get Issue Categories** — Public — list of appointment issue categories.

- **Auth:** None
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/appointments/categories
```

**Sample responses**

`200` — Categories

```json
{
  "status": "success",
  "data": [
    "General Checkup",
    "Cardiology",
    "Pediatrics",
    "Dermatology",
    "Orthopedics"
  ]
}
```

### GET `/api/appointments/recommendations/{category}` 

**Get Recommendations** — Public — recommended documents/doctors for a category.

- **Auth:** None
- **Body:** None
- **Path params:** `category` (string) — Issue category

**Request**

```http
GET {{baseUrl}}/api/appointments/recommendations/{category}
```

**Sample responses**

`200` — Recommendations

```json
{
  "status": "success",
  "data": {
    "category": "Cardiology",
    "recommendedDocs": [
      "ECG within 6 months"
    ]
  }
}
```

### POST `/api/appointments` 🔒

**Create Appointment** — Book an appointment. Passing a slotId validates slot capacity; paymentMethod may be 'service_fee' | 'full' | 'card'. A Telebirr payment of the fee must exist before a fee-bearing booking is accepted.

- **Auth:** Bearer (Patient)
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/appointments
Authorization: Bearer {{patientToken}}
Content-Type: application/json

{
  "doctorId": 12,
  "dateTime": "2026-09-25T06:30:00.000Z",
  "fee": 500,
  "reason": "Chest pain and palpitations",
  "issueCategory": "Cardiology",
  "notes": "First visit",
  "slotId": 4101,
  "paymentMethod": "service_fee",
  "isPaid": true
}
```

**Sample responses**

`201` — Appointment created (auto-generates confirmation code and a hospital card if none exists)

```json
{
  "status": "success",
  "data": {
    "id": 1304,
    "confirmationCode": "BM-8FD2A1",
    "patientId": 41,
    "doctorId": 12,
    "slotId": 4101,
    "cardId": 88,
    "dateTime": "2026-09-25T06:30:00.000Z",
    "fee": 500,
    "reason": "Chest pain and palpitations",
    "issueCategory": "Cardiology",
    "notes": "First visit",
    "status": "accepted",
    "paymentMethod": "service_fee",
    "isPaid": true
  }
}
```

`400` — Payment required

```json
{
  "status": "fail",
  "message": "Payment of 500 ETB is required before booking. Please complete the Telebirr payment first."
}
```

### POST `/api/appointments/upload` 🔒

**Upload Appointment Attachment** — Upload a referral image; returns a Cloudinary URL.

- **Auth:** Bearer (Patient)
- **Body:** multipart/form-data

**Request**

```http
POST {{baseUrl}}/api/appointments/upload
Authorization: Bearer {{patientToken}}
 

# multipart/form-data
#   file: (file) referral.jpg
```


> HTTP body should be `multipart/form-data`. File fields are marked `(file)`.

**Sample responses**

`200` — Uploaded

```json
{
  "status": "success",
  "data": {
    "url": "https://res.cloudinary.com/xxx/.../appointments/ref.jpg"
  }
}
```

### GET `/api/appointments/my` 🔒

**Get My Appointments** — All appointments for the authenticated patient.

- **Auth:** Bearer (Patient)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/appointments/my
Authorization: Bearer {{patientToken}}
```

**Sample responses**

`200` — Appointments

```json
{
  "status": "success",
  "data": [
    {
      "id": 1304,
      "confirmationCode": "BM-8FD2A1",
      "status": "accepted"
    }
  ]
}
```

### PATCH `/api/appointments/{id}/cancel` 🔒

**Cancel Appointment** — Patient cancels their own appointment.

- **Auth:** Bearer (Patient)
- **Body:** None
- **Path params:** `id` (integer) — Appointment ID

**Request**

```http
PATCH {{baseUrl}}/api/appointments/{id}/cancel
Authorization: Bearer {{patientToken}}
```

**Sample responses**

`200` — Cancelled

```json
{
  "status": "success",
  "data": {
    "id": 1304,
    "status": "cancelled"
  }
}
```

### PATCH `/api/appointments/{id}/reschedule` 🔒

**Reschedule Appointment** — Move an appointment to a new date/time.

- **Auth:** Bearer (Patient)
- **Body:** JSON
- **Path params:** `id` (integer) — Appointment ID

**Request**

```http
PATCH {{baseUrl}}/api/appointments/{id}/reschedule
Authorization: Bearer {{patientToken}}
Content-Type: application/json

{
  "dateTime": "2026-09-26T07:00:00.000Z",
  "slotId": 4113
}
```

**Sample responses**

`200` — Rescheduled

```json
{
  "status": "success",
  "data": {
    "id": 1304,
    "dateTime": "2026-09-26T07:00:00.000Z"
  }
}
```

## Appointments — Doctor

### GET `/api/appointments/doctor` 🔒

**Get Doctor Appointments** — Appointments for the authenticated doctor with filters.

- **Auth:** Bearer (Doctor)
- **Body:** None
- **Query params:** `status` e.g. `accepted`; `date` e.g. `2026-09-25`; `from` e.g. `2026-09-25T06:00:00.000Z`; `to` e.g. `2026-09-25T18:00:00.000Z`

**Request**

```http
GET {{baseUrl}}/api/appointments/doctor
Authorization: Bearer {{doctorToken}}
```

**Sample responses**

`200` — Appointments

```json
{
  "status": "success",
  "data": [
    {
      "id": 1304,
      "confirmationCode": "BM-8FD2A1",
      "status": "accepted"
    }
  ]
}
```

### GET `/api/appointments/doctor/calendar` 🔒

**Get Calendar Data** — Appointment counts per day for a month.

- **Auth:** Bearer (Doctor)
- **Body:** None
- **Query params:** `month` e.g. `9`; `year` e.g. `2026`

**Request**

```http
GET {{baseUrl}}/api/appointments/doctor/calendar
Authorization: Bearer {{doctorToken}}
```

**Sample responses**

`200` — Calendar

```json
{
  "status": "success",
  "data": {
    "2026-09-25": 4,
    "2026-09-26": 2
  }
}
```

### GET `/api/appointments/doctor/export` 🔒

**Export Patient List** — Patient list for a date, formatted for export.

- **Auth:** Bearer (Doctor)
- **Body:** None
- **Query params:** `date` e.g. `2026-09-25`

**Request**

```http
GET {{baseUrl}}/api/appointments/doctor/export
Authorization: Bearer {{doctorToken}}
```

**Sample responses**

`200` — Export data

```json
{
  "status": "success",
  "data": []
}
```

### GET `/api/appointments/doctor/stats` 🔒

**Get Doctor Stats** — Quick dashboard stats.

- **Auth:** Bearer (Doctor)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/appointments/doctor/stats
Authorization: Bearer {{doctorToken}}
```

**Sample responses**

`200` — Stats

```json
{
  "status": "success",
  "data": {
    "totalAppointments": 120,
    "pending": 8,
    "accepted": 45,
    "completed": 55,
    "cancelled": 12,
    "totalRevenue": 38400
  }
}
```

### PATCH `/api/appointments/{id}/accept` 🔒

**Accept Appointment** — Accept a pending appointment.

- **Auth:** Bearer (Doctor)
- **Body:** None
- **Path params:** `id` (integer) — Appointment ID

**Request**

```http
PATCH {{baseUrl}}/api/appointments/{id}/accept
Authorization: Bearer {{doctorToken}}
```

**Sample responses**

`200` — Accepted

```json
{
  "status": "success",
  "data": {
    "id": 1304,
    "status": "accepted"
  }
}
```

### PATCH `/api/appointments/{id}/decline` 🔒

**Decline Appointment** — Decline an appointment with a reason.

- **Auth:** Bearer (Doctor)
- **Body:** JSON
- **Path params:** `id` (integer) — Appointment ID

**Request**

```http
PATCH {{baseUrl}}/api/appointments/{id}/decline
Authorization: Bearer {{doctorToken}}
Content-Type: application/json

{
  "reason": "Doctor is unavailable on that date"
}
```

**Sample responses**

`200` — Declined

```json
{
  "status": "success",
  "data": {
    "id": 1304,
    "status": "declined"
  }
}
```

### PATCH `/api/appointments/{id}/complete` 🔒

**Complete Appointment** — Mark an accepted appointment as completed.

- **Auth:** Bearer (Doctor)
- **Body:** None
- **Path params:** `id` (integer) — Appointment ID

**Request**

```http
PATCH {{baseUrl}}/api/appointments/{id}/complete
Authorization: Bearer {{doctorToken}}
```

**Sample responses**

`200` — Completed

```json
{
  "status": "success",
  "data": {
    "id": 1304,
    "status": "completed"
  }
}
```

### POST `/api/appointments/{id}/follow-up` 🔒

**Create Follow-up** — Schedule a follow-up appointment from a completed consultation.

- **Auth:** Bearer (Doctor)
- **Body:** JSON
- **Path params:** `id` (integer) — Appointment ID

**Request**

```http
POST {{baseUrl}}/api/appointments/{id}/follow-up
Authorization: Bearer {{doctorToken}}
Content-Type: application/json

{
  "dateTime": "2026-10-05T07:00:00.000Z",
  "reason": "Follow-up after test results",
  "issueCategory": "Cardiology",
  "notes": "Bring ECG results"
}
```

**Sample responses**

`201` — Follow-up created

```json
{
  "status": "success",
  "data": {
    "id": 1310,
    "confirmationCode": "BM-77C0A1",
    "status": "accepted"
  }
}
```

## Medical Equipment

### GET `/api/equipment/search` 

**Search Equipment** — Public — search medical equipment. Supports Amharic category translations.

- **Auth:** None
- **Body:** None
- **Query params:** `category` e.g. `CT_SCAN`; `hospitalId` e.g. `3`; `city` e.g. `Addis Ababa`; `isOperational` e.g. `true`; `query` e.g. `CT`

**Request**

```http
GET {{baseUrl}}/api/equipment/search
```

**Sample responses**

`200` — Equipment list

```json
{
  "status": "success",
  "data": [
    {
      "id": 21,
      "name": "Siemens CT Scanner",
      "category": "CT_SCAN",
      "hospitalId": 3,
      "price": 3500,
      "currency": "ETB",
      "duration": 30,
      "isOperational": true,
      "description": "64-slice CT scanner",
      "photo": "https://res.cloudinary.com/xxx/.../equipment/ct.jpg",
      "city": "Addis Ababa",
      "operatingHours": {
        "monday": {
          "start": "08:00",
          "end": "17:00",
          "duration": 30,
          "enabled": true
        },
        "tuesday": {
          "start": "08:00",
          "end": "17:00",
          "duration": 30,
          "enabled": true
        }
      },
      "hospital": {
        "id": 3,
        "name": "Kirkos General Hospital",
        "address": "Kirkos, Addis Ababa",
        "phone": "+251116183000",
        "latitude": 9.0108,
        "longitude": 38.7612,
        "cardPrice": 200,
        "serviceFee": {
          "amount": 50
        }
      }
    }
  ]
}
```

### GET `/api/equipment/categories` 

**Get Equipment Categories** — Public — valid equipment categories.

- **Auth:** None
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/equipment/categories
```

**Sample responses**

`200` — Categories

```json
{
  "status": "success",
  "data": [
    "MRI",
    "CT_SCAN",
    "DIALYSIS",
    "ULTRASOUND",
    "XRAY",
    "VENTILATOR",
    "ECG",
    "MAMMOGRAPHY",
    "DEFIBRILLATOR",
    "OTHER"
  ]
}
```

### GET `/api/equipment/hospital/{id}` 

**Get Hospital Equipment** — Public — all operational equipment for a hospital.

- **Auth:** None
- **Body:** None
- **Path params:** `id` (integer) — Hospital ID

**Request**

```http
GET {{baseUrl}}/api/equipment/hospital/{id}
```

**Sample responses**

`200` — Equipment

```json
{
  "status": "success",
  "data": []
}
```

### GET `/api/equipment/detail/{id}` 

**Get Equipment Detail** — Public — detailed equipment with operating hours.

- **Auth:** None
- **Body:** None
- **Path params:** `id` (integer) — Equipment ID

**Request**

```http
GET {{baseUrl}}/api/equipment/detail/{id}
```

**Sample responses**

`200` — Detail

```json
{
  "status": "success",
  "data": {
    "id": 21,
    "name": "Siemens CT Scanner"
  }
}
```

### GET `/api/equipment/announcements` 

**Get Equipment Announcements** — Public — infrastructure announcements for equipment.

- **Auth:** None
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/equipment/announcements
```

**Sample responses**

`200` — Announcements

```json
{
  "status": "success",
  "data": []
}
```

### GET `/api/equipment/{id}/availability` 

**Get Availability** — Public — availability slots for a given date (YYYY-MM-DD).

- **Auth:** None
- **Body:** None
- **Path params:** `id` (integer) — Equipment ID
- **Query params:** `date` *(required)* e.g. `2026-09-25`

**Request**

```http
GET {{baseUrl}}/api/equipment/{id}/availability
```

**Sample responses**

`200` — Availability

```json
{
  "status": "success",
  "data": {
    "date": "2026-09-25",
    "operatingHours": {
      "open": "08:00",
      "close": "12:00",
      "duration": 30
    },
    "slots": [
      {
        "start": "08:00",
        "end": "08:30",
        "booked": false
      },
      {
        "start": "08:30",
        "end": "09:00",
        "booked": true
      },
      {
        "start": "09:00",
        "end": "09:30",
        "booked": false
      }
    ]
  }
}
```

## Equipment Bookings — Patient

### POST `/api/equipment/book` 🔒

**Book Equipment** — Create a confirmed equipment booking. Fee is derived server-side (equipment price + hospital service fee); a matching Telebirr payment must exist.

- **Auth:** Bearer (Patient)
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/equipment/book
Authorization: Bearer {{patientToken}}
Content-Type: application/json

{
  "equipmentId": 21,
  "dateTime": "2026-09-25T08:00:00.000Z",
  "notes": "Knee CT scan",
  "fee": 3550
}
```

**Sample responses**

`201` — Booking created

```json
{
  "status": "success",
  "data": {
    "id": 92,
    "confirmationCode": "BM-4C91F2",
    "patientId": 41,
    "equipmentId": 21,
    "hospitalId": 3,
    "dateTime": "2026-09-25T08:00:00.000Z",
    "fee": 3550,
    "notes": "Knee CT scan",
    "status": "confirmed",
    "equipment": {
      "id": 21,
      "name": "Siemens CT Scanner",
      "category": "CT_SCAN"
    },
    "hospital": {
      "id": 3,
      "name": "Kirkos General Hospital"
    }
  }
}
```

`400` — Slot taken or payment missing

```json
{
  "status": "fail",
  "message": "Payment of 3550 ETB is required before booking. Please complete the Telebirr payment first."
}
```

### GET `/api/equipment/bookings` 🔒

**Get My Bookings** — Bookings for the authenticated patient.

- **Auth:** Bearer (Patient)
- **Body:** None
- **Query params:** `status` e.g. `confirmed`; `date` e.g. `2026-09-25`; `from` e.g. `2026-09-01T00:00:00.000Z`; `to` e.g. `2026-09-30T00:00:00.000Z`

**Request**

```http
GET {{baseUrl}}/api/equipment/bookings
Authorization: Bearer {{patientToken}}
```

**Sample responses**

`200` — Bookings

```json
{
  "status": "success",
  "data": [
    {
      "id": 92,
      "status": "confirmed"
    }
  ]
}
```

### PATCH `/api/equipment/bookings/{id}/cancel` 🔒

**Cancel Booking** — Cancel a booking.

- **Auth:** Bearer (Patient)
- **Body:** None
- **Path params:** `id` (integer) — Booking ID

**Request**

```http
PATCH {{baseUrl}}/api/equipment/bookings/{id}/cancel
Authorization: Bearer {{patientToken}}
```

**Sample responses**

`200` — Cancelled

```json
{
  "status": "success",
  "data": {
    "id": 92,
    "status": "cancelled"
  }
}
```

### PATCH `/api/equipment/bookings/{id}/reschedule` 🔒

**Reschedule Booking** — Reschedule a booking.

- **Auth:** Bearer (Patient)
- **Body:** JSON
- **Path params:** `id` (integer) — Booking ID

**Request**

```http
PATCH {{baseUrl}}/api/equipment/bookings/{id}/reschedule
Authorization: Bearer {{patientToken}}
Content-Type: application/json

{
  "dateTime": "2026-09-26T08:00:00.000Z"
}
```

**Sample responses**

`200` — Rescheduled

```json
{
  "status": "success",
  "data": {
    "id": 92,
    "dateTime": "2026-09-26T08:00:00.000Z"
  }
}
```

## Payments

### POST `/api/payments/initialize` 🔒

**Initialize Payment** — Start a Chapa checkout for an appointment fee. Returns the hosted checkout URL and txRef for verification.

- **Auth:** Bearer (Patient)
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/payments/initialize
Authorization: Bearer {{patientToken}}
Content-Type: application/json

{
  "doctorId": 12,
  "amount": 500,
  "returnUrl": "https://bmbooking.app/patient/appointments"
}
```

**Sample responses**

`200` — Checkout URL

```json
{
  "status": "success",
  "data": {
    "checkoutUrl": "https://checkout.chapa.co/d/...",
    "txRef": "TX17300000004212"
  }
}
```

### GET `/api/payments/verify/{txRef}` 

**Verify Payment** — Check whether a payment succeeded (Chapa or Telebirr).

- **Auth:** None
- **Body:** None
- **Path params:** `txRef` (string) — Transaction reference

**Request**

```http
GET {{baseUrl}}/api/payments/verify/{txRef}
```

**Sample responses**

`200` — Paid

```json
{
  "status": "success",
  "data": {
    "paid": true,
    "provider": "chapa",
    "details": {
      "status": "success"
    }
  }
}
```

`200` — Not paid

```json
{
  "status": "fail",
  "data": {
    "paid": false,
    "message": "Payment not completed"
  }
}
```

### GET `/api/payments/success-redirect` 

**Success Redirect (HTML)** — Hosted 'payment successful' landing page. Supports ?from=tg for the Telegram Mini App flow.

- **Auth:** None
- **Body:** None
- **Query params:** `from` e.g. `tg`

**Request**

```http
GET {{baseUrl}}/api/payments/success-redirect
```

**Sample responses**

`200` — HTML page

```json
<html>...</html>
```

### POST `/api/payments/webhook` 

**Chapa Webhook** — Callback invoked by Chapa after payment.

- **Auth:** None
- **Body:** None

**Request**

```http
POST {{baseUrl}}/api/payments/webhook
```

**Sample responses**

`200` — OK

```json
"OK"
```

### POST `/api/payments/telebirr-notify` 

**Telebirr Notify** — Webhook from telebirr-h5-integration (port 8080) when a TX- order is paid.

- **Auth:** None
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/payments/telebirr-notify
Content-Type: application/json

{
  "orderId": "TX1730000000",
  "status": "paid",
  "amount": 500,
  "transactionId": "TEB123456"
}
```

**Sample responses**

`200` — Recorded

```json
{
  "status": "success"
}
```

### POST `/api/payments/verify-telebirr` 🔒

**Verify Telebirr Payment** — Match a Telebirr ORD order by payment amount (order id stays on the checkout page).

- **Auth:** Bearer (Patient)
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/payments/verify-telebirr
Authorization: Bearer {{patientToken}}
Content-Type: application/json

{
  "amount": 500
}
```

**Sample responses**

`200` — Matched

```json
{
  "status": "success",
  "data": {
    "paid": true,
    "provider": "telebirr",
    "orderId": "ORD1730000000",
    "details": {
      "status": "paid"
    }
  }
}
```

`200` — No match

```json
{
  "status": "fail",
  "data": {
    "paid": false,
    "message": "No matching Telebirr payment found for this amount"
  }
}
```

## Wallet

### GET `/api/wallet` 🔒

**Get Wallet** — Doctor wallet balance with latest 20 transactions.

- **Auth:** Bearer (Doctor)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/wallet
Authorization: Bearer {{doctorToken}}
```

**Sample responses**

`200` — Wallet

```json
{
  "status": "success",
  "data": {
    "id": 4,
    "doctorId": 12,
    "balance": 12450,
    "transactions": [
      {
        "id": 1,
        "walletId": 4,
        "amount": 500,
        "type": "CREDIT",
        "description": "Appointment fee",
        "createdAt": "2026-09-20T10:00:00.000Z"
      }
    ]
  }
}
```

### POST `/api/wallet/withdraw` 🔒

**Request Withdrawal** — Request a bank withdrawal. Requires a saved payment method.

- **Auth:** Bearer (Doctor)
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/wallet/withdraw
Authorization: Bearer {{doctorToken}}
Content-Type: application/json

{
  "amount": 3000,
  "bankName": "Awash Bank",
  "accountNumber": "0134509887652",
  "accountName": "Abel Tesfaye"
}
```

**Sample responses**

`201` — Withdrawal requested

```json
{
  "status": "success",
  "data": {
    "id": 7,
    "walletId": 4,
    "amount": 3000,
    "status": "pending",
    "createdAt": "2026-09-21T10:10:00.000Z"
  }
}
```

`400` — Insufficient balance

```json
{
  "status": "fail",
  "message": "Insufficient balance"
}
```

## Payment Methods

### GET `/api/payment-methods` 🔒

**List Payment Methods** — Doctor's saved bank accounts.

- **Auth:** Bearer (Doctor)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/payment-methods
Authorization: Bearer {{doctorToken}}
```

**Sample responses**

`200` — Methods

```json
{
  "status": "success",
  "data": [
    {
      "id": 3,
      "bankName": "Awash Bank",
      "accountNumber": "0134509887652",
      "accountName": "Abel Tesfaye",
      "isPrimary": true
    }
  ]
}
```

### POST `/api/payment-methods` 🔒

**Add Payment Method** — Add a bank account.

- **Auth:** Bearer (Doctor)
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/payment-methods
Authorization: Bearer {{doctorToken}}
Content-Type: application/json

{
  "bankName": "CBE",
  "accountNumber": "1000012345678",
  "accountName": "Abel Tesfaye"
}
```

**Sample responses**

`201` — Added

```json
{
  "status": "success",
  "data": {
    "id": 4,
    "bankName": "CBE",
    "isPrimary": false
  }
}
```

### DELETE `/api/payment-methods/{id}` 🔒

**Delete Payment Method** — Remove a bank account.

- **Auth:** Bearer (Doctor)
- **Body:** None
- **Path params:** `id` (integer) — Method ID

**Request**

```http
DELETE {{baseUrl}}/api/payment-methods/{id}
Authorization: Bearer {{doctorToken}}
```

**Sample responses**

`200` — Deleted

```json
{
  "status": "success",
  "message": "Payment method deleted"
}
```

### PATCH `/api/payment-methods/{id}/primary` 🔒

**Set Primary Payment Method** — Mark a bank account as the primary withdrawal destination.

- **Auth:** Bearer (Doctor)
- **Body:** None
- **Path params:** `id` (integer) — Method ID

**Request**

```http
PATCH {{baseUrl}}/api/payment-methods/{id}/primary
Authorization: Bearer {{doctorToken}}
```

**Sample responses**

`200` — Primary set

```json
{
  "status": "success",
  "data": {
    "id": 4,
    "isPrimary": true
  }
}
```

## Reviews

### GET `/api/reviews/doctor/{id}` 

**Get Doctor Reviews** — Public — reviews for a doctor.

- **Auth:** None
- **Body:** None
- **Path params:** `id` (integer) — Doctor ID

**Request**

```http
GET {{baseUrl}}/api/reviews/doctor/{id}
```

**Sample responses**

`200` — Reviews

```json
{
  "status": "success",
  "data": [
    {
      "id": 17,
      "patientId": 41,
      "doctorId": 12,
      "hospitalId": null,
      "appointmentId": 1304,
      "rating": 5,
      "comment": "Very professional and kind.",
      "createdAt": "2026-09-20T12:00:00.000Z",
      "patient": {
        "id": 41,
        "patientProfile": {
          "fullName": "Sara Alemu"
        }
      }
    }
  ]
}
```

### GET `/api/reviews/hospital/{id}` 

**Get Hospital Reviews** — Public — reviews for a hospital.

- **Auth:** None
- **Body:** None
- **Path params:** `id` (integer) — Hospital ID

**Request**

```http
GET {{baseUrl}}/api/reviews/hospital/{id}
```

**Sample responses**

`200` — Reviews

```json
{
  "status": "success",
  "data": []
}
```

### POST `/api/reviews` 🔒

**Add Review** — Rate (1–5) a doctor or hospital after a completed appointment. Upserts the review.

- **Auth:** Bearer (Patient)
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/reviews
Authorization: Bearer {{patientToken}}
Content-Type: application/json

{
  "doctorId": 12,
  "rating": 5,
  "comment": "Very professional and kind.",
  "appointmentId": 1304
}
```

**Sample responses**

`201` — Created

```json
{
  "status": "success",
  "data": {
    "id": 18,
    "doctorId": 12,
    "rating": 5,
    "comment": "Very professional and kind."
  }
}
```

`403` — Not eligible

```json
{
  "status": "fail",
  "message": "You can only review a completed appointment."
}
```

## Hospitals

### GET `/api/hospitals` 

**List Hospitals** — Public — approved hospitals with services, ratings and doctor counts.

- **Auth:** None
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/hospitals
```

**Sample responses**

`200` — Hospitals

```json
{
  "status": "success",
  "data": [
    {
      "id": 3,
      "name": "Kirkos General Hospital",
      "address": "Kirkos, Addis Ababa",
      "image": "https://res.cloudinary.com/xxx/.../hospitals/kirkos.jpg",
      "description": "Multi-specialty general hospital.",
      "phone": "+251116183000",
      "latitude": 9.0108,
      "longitude": 38.7612,
      "cardPrice": 200,
      "serviceFee": {
        "amount": 50
      },
      "services": [
        "Cardiology",
        "Radiology",
        "Emergency"
      ],
      "doctorCount": 14,
      "rating": 4.6,
      "totalReviews": 31
    }
  ]
}
```

### GET `/api/hospitals/search` 

**Search Hospitals & Doctors** — Public — combined search across hospitals and doctors with optional radius filtering.

- **Auth:** None
- **Body:** None
- **Query params:** `q` e.g. `cardiology`; `service` e.g. `radiology`; `type` e.g. `hospital|doctor`; `location` e.g. `Bole`; `availability` e.g. `true`; `lat` e.g. `9.03`; `lng` e.g. `38.74`; `radius` e.g. `20`

**Request**

```http
GET {{baseUrl}}/api/hospitals/search
```

**Sample responses**

`200` — Results

```json
{
  "status": "success",
  "data": {
    "doctors": [],
    "hospitals": []
  }
}
```

### GET `/api/hospitals/{id}` 

**Get Hospital Detail** — Public — hospital profile with approved doctors and reviews.

- **Auth:** None
- **Body:** None
- **Path params:** `id` (integer) — Hospital ID

**Request**

```http
GET {{baseUrl}}/api/hospitals/{id}
```

**Sample responses**

`200` — Hospital detail

```json
{
  "status": "success",
  "data": {
    "id": 3,
    "name": "Kirkos General Hospital",
    "address": "Kirkos, Addis Ababa",
    "email": "info@kirkoshospital.com",
    "cardPrice": 200,
    "rating": 4.6,
    "doctors": [
      {
        "id": 12,
        "fullName": "Dr. Abel Tesfaye",
        "specialization": "Cardiology",
        "rating": 4.8
      }
    ],
    "reviews": [
      {
        "id": 5,
        "rating": 5,
        "comment": "Great service",
        "createdAt": "2026-09-01T08:00:00.000Z",
        "patientName": "Sara Alemu"
      }
    ]
  }
}
```

## Notifications

### GET `/api/notifications` 🔒

**Get Notifications** — Paginated notifications for the current user.

- **Auth:** Bearer (Patient)
- **Body:** None
- **Query params:** `page` e.g. `1`; `limit` e.g. `50`

**Request**

```http
GET {{baseUrl}}/api/notifications
Authorization: Bearer {{patientToken}}
```

**Sample responses**

`200` — Notifications

```json
{
  "status": "success",
  "data": {
    "notifications": [
      {
        "id": 500,
        "userId": 41,
        "type": "APPOINTMENT_CONFIRMED",
        "title": "Appointment confirmed",
        "message": "Your appointment (BM-8FD2A1) with Dr. Abel Tesfaye is confirmed.",
        "read": false,
        "createdAt": "2026-09-20T06:30:00.000Z"
      }
    ],
    "unreadCount": 3
  }
}
```

### GET `/api/notifications/unread-count` 🔒

**Get Unread Count** — Unread badge count.

- **Auth:** Bearer (Patient)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/notifications/unread-count
Authorization: Bearer {{patientToken}}
```

**Sample responses**

`200` — Count

```json
{
  "status": "success",
  "data": {
    "unreadCount": 3
  }
}
```

### PATCH `/api/notifications/read-all` 🔒

**Mark All As Read** — Mark every notification as read.

- **Auth:** Bearer (Patient)
- **Body:** None

**Request**

```http
PATCH {{baseUrl}}/api/notifications/read-all
Authorization: Bearer {{patientToken}}
```

**Sample responses**

`200` — Done

```json
{
  "status": "success",
  "message": "5 notifications marked as read"
}
```

### PATCH `/api/notifications/{id}/read` 🔒

**Mark Notification As Read** — Mark a single notification as read.

- **Auth:** Bearer (Patient)
- **Body:** None
- **Path params:** `id` (integer) — Notification ID

**Request**

```http
PATCH {{baseUrl}}/api/notifications/{id}/read
Authorization: Bearer {{patientToken}}
```

**Sample responses**

`200` — Done

```json
{
  "status": "success",
  "message": "Notification marked as read"
}
```

### DELETE `/api/notifications/{id}` 🔒

**Delete Notification** — Delete a notification.

- **Auth:** Bearer (Patient)
- **Body:** None
- **Path params:** `id` (integer) — Notification ID

**Request**

```http
DELETE {{baseUrl}}/api/notifications/{id}
Authorization: Bearer {{patientToken}}
```

**Sample responses**

`200` — Deleted

```json
{
  "status": "success",
  "message": "Notification deleted"
}
```

## Announcements

### GET `/api/announcements` 🔒

**Get My Announcements** — Relevant announcements for the authenticated user.

- **Auth:** Bearer (Patient)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/announcements
Authorization: Bearer {{patientToken}}
```

**Sample responses**

`200` — Announcements

```json
{
  "status": "success",
  "data": [
    {
      "id": 9,
      "title": "Maintenance notice",
      "message": "The MRI unit will be offline on Sunday.",
      "category": "maintenance",
      "published": true,
      "createdAt": "2026-09-18T09:00:00.000Z"
    }
  ]
}
```

## Hospital Applications

### POST `/api/hospital-applications` 

**Submit Hospital Application** — Public — submit a hospital partnership application.

- **Auth:** None
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/hospital-applications
Content-Type: application/json

{
  "hospitalName": "Selam Clinic",
  "contactPerson": "Dr. Hana Girma",
  "contactInfo": "+251911000111 / hana@selamclinic.com"
}
```

**Sample responses**

`201` — Application submitted

```json
{
  "status": "success",
  "data": {
    "id": 5,
    "hospitalName": "Selam Clinic",
    "status": "PENDING",
    "createdAt": "2026-09-21T09:00:00.000Z"
  }
}
```

## Telegram Mini App

### POST `/api/telegram/verify` 

**Verify Telegram User** — Verify a Telegram Mini App initData payload and return the authenticated user.

- **Auth:** None
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/telegram/verify
Content-Type: application/json

{
  "initData": "query_id=AAH... &user=%7B%22id%22%3A12345%7D&auth_date=...&hash=..."
}
```

**Sample responses**

`200` — Verified

```json
{
  "status": "success",
  "data": {
    "valid": true,
    "user": {
      "id": 42,
      "phone": "+251911223344",
      "role": "patient"
    }
  }
}
```

## Admin

### POST `/api/admin/login` 

**Admin Login** — Login for the admin dashboard.

- **Auth:** None
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/admin/login
Content-Type: application/json

{
  "email": "admin@bm-booking.com",
  "password": "admin123"
}
```

**Sample responses**

`200` — Login success

```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@bm-booking.com",
      "role": "admin"
    }
  }
}
```

`401` — Invalid credentials

```json
{
  "status": "fail",
  "message": "Invalid email or password"
}
```

### POST `/api/admin/create` 🔒

**Create Admin** — Create another administrator.

- **Auth:** Bearer (Admin)
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/admin/create
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "email": "ops@bm-booking.com",
  "password": "Ops@2026"
}
```

**Sample responses**

`201` — Created

```json
{
  "status": "success",
  "data": {
    "id": 2,
    "email": "ops@bm-booking.com"
  }
}
```

### GET `/api/admin/doctors` 🔒

**List Doctors** — All doctors with user + reviews.

- **Auth:** Bearer (Admin)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/admin/doctors
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Doctors

```json
{
  "status": "success",
  "data": []
}
```

### GET `/api/admin/doctors/pending` 🔒

**List Pending Doctors** — Doctors awaiting review.

- **Auth:** Bearer (Admin)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/admin/doctors/pending
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Pending

```json
{
  "status": "success",
  "data": []
}
```

### GET `/api/admin/doctors/{id}` 🔒

**Get Doctor Detail** — Doctor detail.

- **Auth:** Bearer (Admin)
- **Body:** None
- **Path params:** `id` (integer) — Doctor ID

**Request**

```http
GET {{baseUrl}}/api/admin/doctors/{id}
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Doctor

```json
{
  "status": "success",
  "data": {
    "id": 12
  }
}
```

### POST `/api/admin/doctors` 🔒

**Create Doctor** — Create a doctor (multipart, profilePicture file).

- **Auth:** Bearer (Admin)
- **Body:** multipart/form-data

**Request**

```http
POST {{baseUrl}}/api/admin/doctors
Authorization: Bearer {{adminToken}}
 

# multipart/form-data
#   fullName: Dr. Betty Girma
#   phone: +251922334455
#   specialization: Pediatrics
#   licenseNumber: LC-778899
#   experienceYears: 7
#   profilePicture: (file) photo.jpg
```


> HTTP body should be `multipart/form-data`. File fields are marked `(file)`.

**Sample responses**

`201` — Created

```json
{
  "status": "success",
  "data": {
    "id": 13
  }
}
```

### POST `/api/admin/doctors/review` 🔒

**Review Doctor** — Approve or reject a doctor's registration.

- **Auth:** Bearer (Admin)
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/admin/doctors/review
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "doctorId": 12,
  "status": "Approved",
  "rejectionReason": null
}
```

**Sample responses**

`200` — Reviewed

```json
{
  "status": "success",
  "data": {
    "id": 12,
    "status": "Approved"
  }
}
```

### POST `/api/admin/doctors/schedules` 🔒

**Create Doctor Schedule** — Create a schedule for any doctor.

- **Auth:** Bearer (Admin)
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/admin/doctors/schedules
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "doctorId": 12,
  "date": "2026-09-25",
  "startTime": "2026-09-25T08:00:00.000Z",
  "endTime": "2026-09-25T12:00:00.000Z",
  "slotDuration": 30
}
```

**Sample responses**

`201` — Created

```json
{
  "status": "success",
  "data": {
    "id": 302
  }
}
```

### GET `/api/admin/doctors/{id}/schedules` 🔒

**Get Doctor Schedules** — Schedules for a doctor.

- **Auth:** Bearer (Admin)
- **Body:** None
- **Path params:** `id` (integer) — Doctor ID

**Request**

```http
GET {{baseUrl}}/api/admin/doctors/{id}/schedules
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Schedules

```json
{
  "status": "success",
  "data": []
}
```

### DELETE `/api/admin/doctors/schedules/{id}` 🔒

**Delete Doctor Schedule** — Delete a schedule.

- **Auth:** Bearer (Admin)
- **Body:** None
- **Path params:** `id` (integer) — Schedule ID

**Request**

```http
DELETE {{baseUrl}}/api/admin/doctors/schedules/{id}
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Deleted

```json
{
  "status": "success",
  "message": "Schedule deleted"
}
```

### PUT `/api/admin/doctors/{id}` 🔒

**Update Doctor** — Update doctor profile (multipart).

- **Auth:** Bearer (Admin)
- **Body:** None
- **Path params:** `id` (integer) — Doctor ID

**Request**

```http
PUT {{baseUrl}}/api/admin/doctors/{id}
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Updated

```json
{
  "status": "success",
  "data": {
    "id": 12
  }
}
```

### DELETE `/api/admin/doctors/{id}` 🔒

**Delete Doctor** — Delete a doctor.

- **Auth:** Bearer (Admin)
- **Body:** None
- **Path params:** `id` (integer) — Doctor ID

**Request**

```http
DELETE {{baseUrl}}/api/admin/doctors/{id}
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Deleted

```json
{
  "status": "success",
  "message": "Doctor deleted"
}
```

### PUT `/api/admin/doctors/{id}/assign-hospital` 🔒

**Assign Doctor to Hospital** — Link a doctor to a hospital.

- **Auth:** Bearer (Admin)
- **Body:** JSON
- **Path params:** `id` (integer) — Doctor ID

**Request**

```http
PUT {{baseUrl}}/api/admin/doctors/{id}/assign-hospital
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "hospitalId": 3
}
```

**Sample responses**

`200` — Assigned

```json
{
  "status": "success",
  "data": {
    "id": 12,
    "hospitalId": 3
  }
}
```

### GET `/api/admin/hospitals/{id}/doctors` 🔒

**List Hospital Doctors** — Doctors belonging to a hospital.

- **Auth:** Bearer (Admin)
- **Body:** None
- **Path params:** `id` (integer) — Hospital ID

**Request**

```http
GET {{baseUrl}}/api/admin/hospitals/{id}/doctors
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Doctors

```json
{
  "status": "success",
  "data": []
}
```

### PUT `/api/admin/doctors/{id}/fee` 🔒

**Update Doctor Fee** — Set the doctor's appointment fee.

- **Auth:** Bearer (Admin)
- **Body:** JSON
- **Path params:** `id` (integer) — Doctor ID

**Request**

```http
PUT {{baseUrl}}/api/admin/doctors/{id}/fee
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "fee": 600
}
```

**Sample responses**

`200` — Updated

```json
{
  "status": "success",
  "data": {
    "id": 12,
    "fee": 600
  }
}
```

### GET `/api/admin/patients` 🔒

**List Patients** — All patients.

- **Auth:** Bearer (Admin)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/admin/patients
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Patients

```json
{
  "status": "success",
  "data": []
}
```

### GET `/api/admin/patients/{id}/history` 🔒

**Get Patient History** — Appointment + equipment booking history for a patient.

- **Auth:** Bearer (Admin)
- **Body:** None
- **Path params:** `id` (integer) — Patient (user) ID

**Request**

```http
GET {{baseUrl}}/api/admin/patients/{id}/history
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — History

```json
{
  "status": "success",
  "data": {
    "patient": {},
    "appointments": [],
    "equipmentBookings": []
  }
}
```

### GET `/api/admin/stats/summary` 🔒

**Get System Stats Summary** — System-wide totals.

- **Auth:** Bearer (Admin)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/admin/stats/summary
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Summary

```json
{
  "status": "success",
  "data": {
    "total": 842,
    "byStatus": {
      "accepted": 500,
      "completed": 300,
      "cancelled": 42
    },
    "todayAppts": 15,
    "totalRevenue": 285000
  }
}
```

### GET `/api/admin/stats/patient-growth` 🔒

**Get Patient Growth** — Monthly patient growth series.

- **Auth:** Bearer (Admin)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/admin/stats/patient-growth
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Growth

```json
{
  "status": "success",
  "data": []
}
```

### GET `/api/admin/stats/active-patients` 🔒

**Get Active Patients** — Active patient counts.

- **Auth:** Bearer (Admin)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/admin/stats/active-patients
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Active

```json
{
  "status": "success",
  "data": {
    "activeThisMonth": 210,
    "activeThisWeek": 64
  }
}
```

### GET `/api/admin/stats/appointments` 🔒

**Get Appointment Stats** — Appointment statistics.

- **Auth:** Bearer (Admin)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/admin/stats/appointments
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Stats

```json
{
  "status": "success",
  "data": {}
}
```

### GET `/api/admin/stats/staff-performance` 🔒

**Get Staff Performance** — Receptionist performance metrics.

- **Auth:** Bearer (Admin)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/admin/stats/staff-performance
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Performance

```json
{
  "status": "success",
  "data": []
}
```

### GET `/api/admin/stats/equipment-utilization` 🔒

**Get Equipment Utilization** — Equipment utilization rates.

- **Auth:** Bearer (Admin)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/admin/stats/equipment-utilization
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Utilization

```json
{
  "status": "success",
  "data": []
}
```

### GET `/api/admin/analytics` 🔒

**Get Analytics** — Combined analytics.

- **Auth:** Bearer (Admin)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/admin/analytics
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Analytics

```json
{
  "status": "success",
  "data": {}
}
```

### GET `/api/admin/hospitals` 🔒

**List Hospitals** — All hospitals.

- **Auth:** Bearer (Admin)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/admin/hospitals
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Hospitals

```json
{
  "status": "success",
  "data": []
}
```

### POST `/api/admin/hospitals` 🔒

**Create Hospital** — Create a hospital (multipart, image file).

- **Auth:** Bearer (Admin)
- **Body:** multipart/form-data

**Request**

```http
POST {{baseUrl}}/api/admin/hospitals
Authorization: Bearer {{adminToken}}
 

# multipart/form-data
#   name: Kirkos General Hospital
#   cardPrice: 200
#   address: Kirkos, Addis Ababa
#   phone: +251116183000
#   email: info@kirkoshospital.com
#   latitude: 9.0108
#   longitude: 38.7612
#   image: (file) kirkos.jpg
```


> HTTP body should be `multipart/form-data`. File fields are marked `(file)`.

**Sample responses**

`201` — Created

```json
{
  "status": "success",
  "data": {
    "id": 3
  }
}
```

### PUT `/api/admin/hospitals/{id}` 🔒

**Update Hospital** — Update a hospital (multipart).

- **Auth:** Bearer (Admin)
- **Body:** None
- **Path params:** `id` (integer) — Hospital ID

**Request**

```http
PUT {{baseUrl}}/api/admin/hospitals/{id}
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Updated

```json
{
  "status": "success",
  "data": {
    "id": 3
  }
}
```

### DELETE `/api/admin/hospitals/{id}` 🔒

**Delete Hospital** — Delete a hospital.

- **Auth:** Bearer (Admin)
- **Body:** None
- **Path params:** `id` (integer) — Hospital ID

**Request**

```http
DELETE {{baseUrl}}/api/admin/hospitals/{id}
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Deleted

```json
{
  "status": "success",
  "message": "Hospital deleted"
}
```

### PUT `/api/admin/hospitals/{id}/service-fee` 🔒

**Set Hospital Service Fee** — Set the platform service fee for a hospital.

- **Auth:** Bearer (Admin)
- **Body:** JSON
- **Path params:** `id` (integer) — Hospital ID

**Request**

```http
PUT {{baseUrl}}/api/admin/hospitals/{id}/service-fee
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "amount": 50
}
```

**Sample responses**

`200` — Set

```json
{
  "status": "success",
  "data": {
    "hospitalId": 3,
    "amount": 50
  }
}
```

### GET `/api/admin/receptionists` 🔒

**List Receptionists** — All receptionist staff.

- **Auth:** Bearer (Admin)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/admin/receptionists
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Receptionists

```json
{
  "status": "success",
  "data": []
}
```

### POST `/api/admin/receptionists` 🔒

**Create Receptionist** — Create a receptionist account.

- **Auth:** Bearer (Admin)
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/admin/receptionists
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "username": "r_kirkos",
  "password": "Reception@2026",
  "hospitalId": 3,
  "fullName": "Marta Bekele",
  "phone": "+251912233445"
}
```

**Sample responses**

`201` — Created

```json
{
  "status": "success",
  "data": {
    "id": 22
  }
}
```

### PUT `/api/admin/receptionists/{id}` 🔒

**Update Receptionist** — Update receptionist profile/permissions.

- **Auth:** Bearer (Admin)
- **Body:** None
- **Path params:** `id` (integer) — Receptionist ID

**Request**

```http
PUT {{baseUrl}}/api/admin/receptionists/{id}
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Updated

```json
{
  "status": "success",
  "data": {
    "id": 22
  }
}
```

### DELETE `/api/admin/receptionists/{id}` 🔒

**Delete Receptionist** — Delete a receptionist.

- **Auth:** Bearer (Admin)
- **Body:** None
- **Path params:** `id` (integer) — Receptionist ID

**Request**

```http
DELETE {{baseUrl}}/api/admin/receptionists/{id}
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Deleted

```json
{
  "status": "success",
  "message": "Receptionist deleted"
}
```

### GET `/api/admin/withdrawals` 🔒

**List Withdrawal Requests** — Pending doctor withdrawals.

- **Auth:** Bearer (Admin)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/admin/withdrawals
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Withdrawals

```json
{
  "status": "success",
  "data": []
}
```

### POST `/api/admin/withdrawals/{id}/complete` 🔒

**Complete Withdrawal** — Mark a withdrawal complete and upload the bank receipt.

- **Auth:** Bearer (Admin)
- **Body:** multipart/form-data
- **Path params:** `id` (integer) — Withdrawal ID

**Request**

```http
POST {{baseUrl}}/api/admin/withdrawals/{id}/complete
Authorization: Bearer {{adminToken}}
 

# multipart/form-data
#   receipt: (file) receipt.jpg
```


> HTTP body should be `multipart/form-data`. File fields are marked `(file)`.

**Sample responses**

`200` — Completed

```json
{
  "status": "success",
  "data": {
    "id": 7,
    "status": "completed"
  }
}
```

### POST `/api/admin/equipment` 🔒

**Add Equipment** — Add medical equipment (multipart). operatingHours and price are JSON-encoded form fields.

- **Auth:** Bearer (Admin)
- **Body:** multipart/form-data

**Request**

```http
POST {{baseUrl}}/api/admin/equipment
Authorization: Bearer {{adminToken}}
 

# multipart/form-data
#   name: Siemens CT Scanner
#   category: CT_SCAN
#   hospitalId: 3
#   duration: 30
#   price: { "amount": 3500 }
#   operatingHours: {"monday":{"start":"08:00","end":"17:00","duration":30,"enabled":true}}
#   photo: (file) ct.jpg
```


> HTTP body should be `multipart/form-data`. File fields are marked `(file)`.

**Sample responses**

`201` — Added

```json
{
  "status": "success",
  "data": {
    "id": 21
  }
}
```

### POST `/api/admin/equipment/bulk` 🔒

**Bulk Add Equipment** — Add multiple equipment items at once.

- **Auth:** Bearer (Admin)
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/admin/equipment/bulk
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "items": [
    {
      "name": "Ventilator A",
      "category": "VENTILATOR",
      "hospitalId": 3,
      "duration": 60
    },
    {
      "name": "Ventilator B",
      "category": "VENTILATOR",
      "hospitalId": 3,
      "duration": 60
    }
  ]
}
```

**Sample responses**

`201` — Added

```json
{
  "status": "success",
  "data": {
    "count": 2
  }
}
```

### PUT `/api/admin/equipment/{id}` 🔒

**Update Equipment** — Update equipment (multipart).

- **Auth:** Bearer (Admin)
- **Body:** None
- **Path params:** `id` (integer) — Equipment ID

**Request**

```http
PUT {{baseUrl}}/api/admin/equipment/{id}
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Updated

```json
{
  "status": "success",
  "data": {
    "id": 21
  }
}
```

### DELETE `/api/admin/equipment/{id}` 🔒

**Delete Equipment** — Delete equipment.

- **Auth:** Bearer (Admin)
- **Body:** None
- **Path params:** `id` (integer) — Equipment ID

**Request**

```http
DELETE {{baseUrl}}/api/admin/equipment/{id}
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Deleted

```json
{
  "status": "success",
  "message": "Equipment deleted"
}
```

### POST `/api/admin/equipment/announce` 🔒

**Create Equipment Announcement** — Broadcast a maintenance/availability announcement.

- **Auth:** Bearer (Admin)
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/admin/equipment/announce
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "title": "Maintenance notice",
  "message": "MRI down Sunday",
  "category": "maintenance",
  "hospitalId": 3
}
```

**Sample responses**

`201` — Created

```json
{
  "status": "success",
  "data": {
    "id": 9
  }
}
```

### GET `/api/admin/equipment-bookings` 🔒

**List All Equipment Bookings** — Equipment bookings across all hospitals.

- **Auth:** Bearer (Admin)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/admin/equipment-bookings
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Bookings

```json
{
  "status": "success",
  "data": []
}
```

### GET `/api/admin/hospital-applications` 🔒

**List Hospital Applications** — Partnership applications.

- **Auth:** Bearer (Admin)
- **Body:** None
- **Query params:** `status` e.g. `PENDING`

**Request**

```http
GET {{baseUrl}}/api/admin/hospital-applications
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Applications

```json
{
  "status": "success",
  "data": []
}
```

### PATCH `/api/admin/hospital-applications/{id}` 🔒

**Update Hospital Application** — Mark an application CONTACTED and add notes.

- **Auth:** Bearer (Admin)
- **Body:** JSON
- **Path params:** `id` (integer) — Application ID

**Request**

```http
PATCH {{baseUrl}}/api/admin/hospital-applications/{id}
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "status": "CONTACTED",
  "notes": "Called manager on 2026-09-21"
}
```

**Sample responses**

`200` — Updated

```json
{
  "status": "success",
  "data": {
    "id": 5,
    "status": "CONTACTED"
  }
}
```

### GET `/api/admin/hospital-registrations` 🔒

**List Hospital Registrations** — Hospital portal registration requests.

- **Auth:** Bearer (Admin)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/admin/hospital-registrations
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Registrations

```json
{
  "status": "success",
  "data": []
}
```

### PATCH `/api/admin/hospital-registrations/{id}` 🔒

**Update Hospital Registration** — Approve/reject a hospital registration.

- **Auth:** Bearer (Admin)
- **Body:** None
- **Path params:** `id` (integer) — Registration ID

**Request**

```http
PATCH {{baseUrl}}/api/admin/hospital-registrations/{id}
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Updated

```json
{
  "status": "success",
  "data": {
    "id": 3,
    "status": "APPROVED"
  }
}
```

### POST `/api/admin/announcements` 🔒

**Create Announcement** — Create an announcement.

- **Auth:** Bearer (Admin)
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/admin/announcements
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "title": "New feature",
  "message": "Equipment booking now live.",
  "category": "general"
}
```

**Sample responses**

`201` — Created

```json
{
  "status": "success",
  "data": {
    "id": 10
  }
}
```

### PUT `/api/admin/announcements/{id}` 🔒

**Update Announcement** — Update an announcement.

- **Auth:** Bearer (Admin)
- **Body:** None
- **Path params:** `id` (integer) — Announcement ID

**Request**

```http
PUT {{baseUrl}}/api/admin/announcements/{id}
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Updated

```json
{
  "status": "success",
  "data": {
    "id": 10
  }
}
```

### DELETE `/api/admin/announcements/{id}` 🔒

**Delete Announcement** — Delete an announcement.

- **Auth:** Bearer (Admin)
- **Body:** None
- **Path params:** `id` (integer) — Announcement ID

**Request**

```http
DELETE {{baseUrl}}/api/admin/announcements/{id}
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Deleted

```json
{
  "status": "success",
  "data": {
    "id": 10
  }
}
```

### PATCH `/api/admin/announcements/{id}/publish` 🔒

**Publish Announcement** — Publish an announcement.

- **Auth:** Bearer (Admin)
- **Body:** None
- **Path params:** `id` (integer) — Announcement ID

**Request**

```http
PATCH {{baseUrl}}/api/admin/announcements/{id}/publish
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Published

```json
{
  "status": "success",
  "data": {
    "id": 10,
    "published": true
  }
}
```

### POST `/api/admin/announcements/{id}/resend` 🔒

**Resend Announcement** — Re-push an announcement to recipients.

- **Auth:** Bearer (Admin)
- **Body:** None
- **Path params:** `id` (integer) — Announcement ID

**Request**

```http
POST {{baseUrl}}/api/admin/announcements/{id}/resend
Authorization: Bearer {{adminToken}}
```

**Sample responses**

`200` — Sent

```json
{
  "status": "success",
  "message": "Announcement resent"
}
```

## Hospital Portal

### POST `/api/hospital/register` 

**Register Hospital** — Public — register a hospital and its admin account. Awaiting admin approval before login works.

- **Auth:** None
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/hospital/register
Content-Type: application/json

{
  "name": "Kirkos General Hospital",
  "address": "Kirkos, Addis Ababa",
  "phone": "+251116183000",
  "email": "info@kirkoshospital.com",
  "adminPhone": "+251911223344",
  "password": "Hospital@2026",
  "services": [
    "Cardiology",
    "Radiology"
  ],
  "latitude": 9.0108,
  "longitude": 38.7612
}
```

**Sample responses**

`201` — Registered

```json
{
  "status": "success",
  "data": {
    "hospitalId": 3,
    "status": "PENDING"
  }
}
```

`409` — Already registered

```json
{
  "status": "fail",
  "message": "A hospital with this name/phone already exists"
}
```

### GET `/api/hospital/me` 🔒

**Get Portal Context (Me)** — Current portal user + hospital context.

- **Auth:** Bearer (Hospital Portal owner/staff)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/hospital/me
Authorization: Bearer {{hospitalToken}}
```

**Sample responses**

`200` — Context

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 3,
      "role": "hospital",
      "hospitalRole": "owner",
      "hospitalId": 3,
      "permissions": [
        "*"
      ],
      "username": null,
      "phone": "+251911223344",
      "fullName": null
    },
    "hospital": {
      "id": 3,
      "name": "Kirkos General Hospital",
      "logo": null,
      "status": "APPROVED"
    }
  }
}
```

### GET `/api/hospital/profile` 🔒

**Get Profile** — Full hospital profile (settings.view).

- **Auth:** Bearer (Hospital Portal owner/staff)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/hospital/profile
Authorization: Bearer {{hospitalToken}}
```

**Sample responses**

`200` — Profile

```json
{
  "status": "success",
  "data": {
    "id": 3,
    "name": "Kirkos General Hospital"
  }
}
```

### PATCH `/api/hospital/profile` 🔒

**Update Profile** — Update hospital profile (settings.edit).

- **Auth:** Bearer (Hospital Portal owner/staff)
- **Body:** JSON

**Request**

```http
PATCH {{baseUrl}}/api/hospital/profile
Authorization: Bearer {{hospitalToken}}
Content-Type: application/json

{
  "description": "Renovated 2026.",
  "phone": "+251116183000"
}
```

**Sample responses**

`200` — Updated

```json
{
  "status": "success",
  "data": {
    "id": 3
  }
}
```

### GET `/api/hospital/stats` 🔒

**Get Stats** — Hospital dashboard stats (analytics.view).

- **Auth:** Bearer (Hospital Portal owner/staff)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/hospital/stats
Authorization: Bearer {{hospitalToken}}
```

**Sample responses**

`200` — Stats

```json
{
  "status": "success",
  "data": {
    "doctors": 14,
    "appointmentsThisMonth": 210,
    "revenueThisMonth": 96000,
    "equipmentBookings": 18
  }
}
```

### GET `/api/hospital/overview` 🔒

**Get Overview** — Overview widgets (analytics.view).

- **Auth:** Bearer (Hospital Portal owner/staff)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/hospital/overview
Authorization: Bearer {{hospitalToken}}
```

**Sample responses**

`200` — Overview

```json
{
  "status": "success",
  "data": {}
}
```

### GET `/api/hospital/appointments` 🔒

**List Appointments** — Hospital-wide appointments with filters.

- **Auth:** Bearer (Hospital Portal owner/staff)
- **Body:** None
- **Query params:** `status` e.g. `pending`; `from` e.g. `2026-09-01T00:00:00.000Z`; `to` e.g. `2026-09-30T00:00:00.000Z`; `search` e.g. `BM-8FD2A1`; `limit` e.g. `500`

**Request**

```http
GET {{baseUrl}}/api/hospital/appointments
Authorization: Bearer {{hospitalToken}}
```

**Sample responses**

`200` — Appointments

```json
{
  "status": "success",
  "data": {
    "appointments": [],
    "total": 0
  }
}
```

### GET `/api/hospital/doctors` 🔒

**List Doctors** — Doctors of the hospital.

- **Auth:** Bearer (Hospital Portal owner/staff)
- **Body:** None
- **Query params:** `includeAll` e.g. `true`

**Request**

```http
GET {{baseUrl}}/api/hospital/doctors
Authorization: Bearer {{hospitalToken}}
```

**Sample responses**

`200` — Doctors

```json
{
  "status": "success",
  "data": []
}
```

### POST `/api/hospital/doctors/register` 🔒

**Register Doctor** — Register a doctor to the hospital (multipart files).

- **Auth:** Bearer (Hospital Portal owner/staff)
- **Body:** multipart/form-data

**Request**

```http
POST {{baseUrl}}/api/hospital/doctors/register
Authorization: Bearer {{hospitalToken}}
 

# multipart/form-data
#   fullName: Dr. Betty Girma
#   phone: +251922334455
#   email: betty@kirkoshospital.com
#   specialization: Pediatrics
#   licenseNumber: LC-778899
#   experienceYears: 7
#   profilePicture: (file) photo.jpg
#   introVideo: (file) intro.mp4
```


> HTTP body should be `multipart/form-data`. File fields are marked `(file)`.

**Sample responses**

`201` — Registered

```json
{
  "status": "success",
  "data": {
    "id": 13
  }
}
```

### PATCH `/api/hospital/doctors/{id}/status` 🔒

**Update Doctor Status** — Set doctor operational status.

- **Auth:** Bearer (Hospital Portal owner/staff)
- **Body:** None
- **Path params:** `id` (integer) — Doctor ID

**Request**

```http
PATCH {{baseUrl}}/api/hospital/doctors/{id}/status
Authorization: Bearer {{hospitalToken}}
```

**Sample responses**

`200` — Updated

```json
{
  "status": "success",
  "data": {
    "id": 13,
    "isActive": true
  }
}
```

### GET `/api/hospital/schedules` 🔒

**List Schedules** — All hospital doctor schedules.

- **Auth:** Bearer (Hospital Portal owner/staff)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/hospital/schedules
Authorization: Bearer {{hospitalToken}}
```

**Sample responses**

`200` — Schedules

```json
{
  "status": "success",
  "data": []
}
```

### PATCH `/api/hospital/appointments/{id}/approve` 🔒

**Approve Appointment** — Approve an appointment (optionally assign a slot).

- **Auth:** Bearer (Hospital Portal owner/staff)
- **Body:** JSON
- **Path params:** `id` (integer) — Appointment ID

**Request**

```http
PATCH {{baseUrl}}/api/hospital/appointments/{id}/approve
Authorization: Bearer {{hospitalToken}}
Content-Type: application/json

{
  "slotId": 4101
}
```

**Sample responses**

`200` — Approved

```json
{
  "status": "success",
  "data": {
    "id": 1304,
    "status": "accepted"
  }
}
```

### POST `/api/hospital/equipment` 🔒

**Add Equipment** — Add equipment to the hospital (multipart).

- **Auth:** Bearer (Hospital Portal owner/staff)
- **Body:** multipart/form-data

**Request**

```http
POST {{baseUrl}}/api/hospital/equipment
Authorization: Bearer {{hospitalToken}}
 

# multipart/form-data
#   name: Siemens CT Scanner
#   category: CT_SCAN
#   price: 3500
#   operatingHours: {"monday":{"start":"08:00","end":"17:00","duration":30,"enabled":true}}
#   photo: (file) ct.jpg
```


> HTTP body should be `multipart/form-data`. File fields are marked `(file)`.

**Sample responses**

`201` — Added

```json
{
  "status": "success",
  "data": {
    "id": 21
  }
}
```

### GET `/api/hospital/equipment-bookings` 🔒

**List Equipment Bookings** — Bookings for the hospital's equipment.

- **Auth:** Bearer (Hospital Portal owner/staff)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/hospital/equipment-bookings
Authorization: Bearer {{hospitalToken}}
```

**Sample responses**

`200` — Bookings

```json
{
  "status": "success",
  "data": []
}
```

### PATCH `/api/hospital/equipment-bookings/{id}/confirm` 🔒

**Confirm Equipment Booking** — Confirm a booking.

- **Auth:** Bearer (Hospital Portal owner/staff)
- **Body:** None
- **Path params:** `id` (integer) — Booking ID

**Request**

```http
PATCH {{baseUrl}}/api/hospital/equipment-bookings/{id}/confirm
Authorization: Bearer {{hospitalToken}}
```

**Sample responses**

`200` — Confirmed

```json
{
  "status": "success",
  "data": {
    "id": 92,
    "status": "confirmed"
  }
}
```

### POST `/api/hospital/card-templates` 🔒

**Create Card Template** — Define a patient card template.

- **Auth:** Bearer (Hospital Portal owner/staff)
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/hospital/card-templates
Authorization: Bearer {{hospitalToken}}
Content-Type: application/json

{
  "name": "Annual Visit Card",
  "price": 2000,
  "validityDays": 365
}
```

**Sample responses**

`201` — Created

```json
{
  "status": "success",
  "data": {
    "id": 3
  }
}
```

### POST `/api/hospital/cards` 🔒

**Issue Patient Card** — Issue a card to a patient.

- **Auth:** Bearer (Hospital Portal owner/staff)
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/hospital/cards
Authorization: Bearer {{hospitalToken}}
Content-Type: application/json

{
  "patientId": 41,
  "templateId": 3,
  "isPaid": true
}
```

**Sample responses**

`201` — Issued

```json
{
  "status": "success",
  "data": {
    "id": 88,
    "code": "KGH-2026-0001"
  }
}
```

### GET `/api/hospital/staff` 🔒

**List Staff** — List receptionist staff (owner only).

- **Auth:** Bearer (Hospital Portal owner/staff)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/hospital/staff
Authorization: Bearer {{hospitalToken}}
```

**Sample responses**

`200` — Staff

```json
{
  "status": "success",
  "data": []
}
```

### POST `/api/hospital/staff` 🔒

**Create Staff** — Create a receptionist (owner only).

- **Auth:** Bearer (Hospital Portal owner/staff)
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/hospital/staff
Authorization: Bearer {{hospitalToken}}
Content-Type: application/json

{
  "username": "r_kirkos",
  "password": "Reception@2026",
  "fullName": "Marta Bekele",
  "phone": "+251912233445",
  "permissions": [
    "appointments.view",
    "patients.create"
  ]
}
```

**Sample responses**

`201` — Created

```json
{
  "status": "success",
  "data": {
    "id": 22
  }
}
```

## Receptionist (Legacy /api/receptionist)

### GET `/api/receptionist/stats/dashboard` 🔒

**Get Dashboard Stats** — Receptionist dashboard.

- **Auth:** Bearer (Receptionist)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/receptionist/stats/dashboard
Authorization: Bearer {{receptionistToken}}
```

**Sample responses**

`200` — Stats

```json
{
  "status": "success",
  "data": {}
}
```

### GET `/api/receptionist/hospital` 🔒

**Get Hospital** — The receptionist's hospital.

- **Auth:** Bearer (Receptionist)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/receptionist/hospital
Authorization: Bearer {{receptionistToken}}
```

**Sample responses**

`200` — Hospital

```json
{
  "status": "success",
  "data": {
    "id": 3
  }
}
```

### PATCH `/api/receptionist/hospital/card-price` 🔒

**Update Hospital Card Price** — Set hospital card price.

- **Auth:** Bearer (Receptionist)
- **Body:** JSON

**Request**

```http
PATCH {{baseUrl}}/api/receptionist/hospital/card-price
Authorization: Bearer {{receptionistToken}}
Content-Type: application/json

{
  "cardPrice": 250
}
```

**Sample responses**

`200` — Updated

```json
{
  "status": "success",
  "data": {
    "id": 3,
    "cardPrice": 250
  }
}
```

### GET `/api/receptionist/patients` 🔒

**Search Patients** — Search patients by name/phone.

- **Auth:** Bearer (Receptionist)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/receptionist/patients
Authorization: Bearer {{receptionistToken}}
```

**Sample responses**

`200` — Patients

```json
{
  "status": "success",
  "data": []
}
```

### GET `/api/receptionist/patients/directory` 🔒

**Patient Directory** — Paginated patient directory.

- **Auth:** Bearer (Receptionist)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/receptionist/patients/directory
Authorization: Bearer {{receptionistToken}}
```

**Sample responses**

`200` — Directory

```json
{
  "status": "success",
  "data": {
    "data": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

### POST `/api/receptionist/patients` 🔒

**Create Patient** — Register a new patient.

- **Auth:** Bearer (Receptionist)
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/receptionist/patients
Authorization: Bearer {{receptionistToken}}
Content-Type: application/json

{
  "phone": "+251911111222",
  "fullName": "Helen Tadesse",
  "gender": "female",
  "dateOfBirth": "1990-07-15"
}
```

**Sample responses**

`201` — Created

```json
{
  "status": "success",
  "data": {
    "id": 42,
    "phone": "+251911111222"
  }
}
```

### GET `/api/receptionist/patients/{id}/history` 🔒

**Get Patient History** — Appointments + equipment bookings for a patient.

- **Auth:** Bearer (Receptionist)
- **Body:** None
- **Path params:** `id` (integer) — Patient user ID

**Request**

```http
GET {{baseUrl}}/api/receptionist/patients/{id}/history
Authorization: Bearer {{receptionistToken}}
```

**Sample responses**

`200` — History

```json
{
  "status": "success",
  "data": {
    "patient": {},
    "appointments": [],
    "equipmentBookings": []
  }
}
```

### GET `/api/receptionist/doctors` 🔒

**List Hospital Doctors** — Doctors of the hospital.

- **Auth:** Bearer (Receptionist)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/receptionist/doctors
Authorization: Bearer {{receptionistToken}}
```

**Sample responses**

`200` — Doctors

```json
{
  "status": "success",
  "data": []
}
```

### POST `/api/receptionist/doctors/register` 🔒

**Register Doctor** — Register a doctor (multipart).

- **Auth:** Bearer (Receptionist)
- **Body:** multipart/form-data

**Request**

```http
POST {{baseUrl}}/api/receptionist/doctors/register
Authorization: Bearer {{receptionistToken}}
 

# multipart/form-data
#   fullName: Dr. Betty Girma
#   phone: +251922334455
#   specialization: Pediatrics
#   licenseNumber: LC-778899
#   profilePicture: (file) photo.jpg
```


> HTTP body should be `multipart/form-data`. File fields are marked `(file)`.

**Sample responses**

`201` — Registered

```json
{
  "status": "success",
  "data": {
    "id": 13
  }
}
```

### PATCH `/api/receptionist/doctors/{id}/review` 🔒

**Review Doctor** — Approve or reject a registered doctor.

- **Auth:** Bearer (Receptionist)
- **Body:** JSON
- **Path params:** `id` (integer) — Doctor ID

**Request**

```http
PATCH {{baseUrl}}/api/receptionist/doctors/{id}/review
Authorization: Bearer {{receptionistToken}}
Content-Type: application/json

{
  "status": "Approved",
  "rejectionReason": null
}
```

**Sample responses**

`200` — Reviewed

```json
{
  "status": "success",
  "data": {
    "id": 13,
    "status": "Approved"
  }
}
```

### GET `/api/receptionist/equipment` 🔒

**List Equipment** — Hospital equipment.

- **Auth:** Bearer (Receptionist)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/receptionist/equipment
Authorization: Bearer {{receptionistToken}}
```

**Sample responses**

`200` — Equipment

```json
{
  "status": "success",
  "data": []
}
```

### POST `/api/receptionist/equipment` 🔒

**Add Equipment** — Add equipment (multipart).

- **Auth:** Bearer (Receptionist)
- **Body:** multipart/form-data

**Request**

```http
POST {{baseUrl}}/api/receptionist/equipment
Authorization: Bearer {{receptionistToken}}
 

# multipart/form-data
#   name: Ultrasound GE
#   category: ULTRASOUND
#   price: 800
#   photo: (file) us.jpg
```


> HTTP body should be `multipart/form-data`. File fields are marked `(file)`.

**Sample responses**

`201` — Added

```json
{
  "status": "success",
  "data": {
    "id": 22
  }
}
```

### GET `/api/receptionist/schedules` 🔒

**List Schedules** — Hospital doctor schedules.

- **Auth:** Bearer (Receptionist)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/receptionist/schedules
Authorization: Bearer {{receptionistToken}}
```

**Sample responses**

`200` — Schedules

```json
{
  "status": "success",
  "data": []
}
```

### POST `/api/receptionist/schedules` 🔒

**Create Schedule** — Create a schedule for a doctor.

- **Auth:** Bearer (Receptionist)
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/receptionist/schedules
Authorization: Bearer {{receptionistToken}}
Content-Type: application/json

{
  "doctorId": 12,
  "date": "2026-09-25",
  "startTime": "2026-09-25T08:00:00.000Z",
  "endTime": "2026-09-25T12:00:00.000Z",
  "slotDuration": 30
}
```

**Sample responses**

`201` — Created

```json
{
  "status": "success",
  "data": {
    "id": 303
  }
}
```

### GET `/api/receptionist/appointments/upcoming` 🔒

**List Upcoming Appointments** — Upcoming appointments.

- **Auth:** Bearer (Receptionist)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/receptionist/appointments/upcoming
Authorization: Bearer {{receptionistToken}}
```

**Sample responses**

`200` — Appointments

```json
{
  "status": "success",
  "data": []
}
```

### PATCH `/api/receptionist/appointments/{id}/approve` 🔒

**Approve Appointment** — Approve an appointment.

- **Auth:** Bearer (Receptionist)
- **Body:** JSON
- **Path params:** `id` (integer) — Appointment ID

**Request**

```http
PATCH {{baseUrl}}/api/receptionist/appointments/{id}/approve
Authorization: Bearer {{receptionistToken}}
Content-Type: application/json

{
  "slotId": 4101
}
```

**Sample responses**

`200` — Approved

```json
{
  "status": "success",
  "data": {
    "id": 1304
  }
}
```

### PATCH `/api/receptionist/appointments/{id}/deny` 🔒

**Deny Appointment** — Deny an appointment with a reason.

- **Auth:** Bearer (Receptionist)
- **Body:** JSON
- **Path params:** `id` (integer) — Appointment ID

**Request**

```http
PATCH {{baseUrl}}/api/receptionist/appointments/{id}/deny
Authorization: Bearer {{receptionistToken}}
Content-Type: application/json

{
  "reason": "Doctor unavailable"
}
```

**Sample responses**

`200` — Denied

```json
{
  "status": "success",
  "data": {
    "id": 1304,
    "status": "declined"
  }
}
```

### POST `/api/receptionist/equipment-bookings` 🔒

**Create Equipment Booking** — Book equipment for a patient.

- **Auth:** Bearer (Receptionist)
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/receptionist/equipment-bookings
Authorization: Bearer {{receptionistToken}}
Content-Type: application/json

{
  "patientId": 41,
  "equipmentId": 21,
  "dateTime": "2026-09-25T08:00:00.000Z",
  "fee": 3550,
  "notes": "Knee CT"
}
```

**Sample responses**

`201` — Created

```json
{
  "status": "success",
  "data": {
    "id": 92,
    "confirmationCode": "BM-4C91F2"
  }
}
```

### GET `/api/receptionist/equipment-bookings` 🔒

**List Equipment Bookings** — Hospital equipment bookings.

- **Auth:** Bearer (Receptionist)
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/receptionist/equipment-bookings
Authorization: Bearer {{receptionistToken}}
```

**Sample responses**

`200` — Bookings

```json
{
  "status": "success",
  "data": []
}
```

### POST `/api/receptionist/card-templates` 🔒

**Create Card Template** — Create a card template.

- **Auth:** Bearer (Receptionist)
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/receptionist/card-templates
Authorization: Bearer {{receptionistToken}}
Content-Type: application/json

{
  "name": "Monthly Card",
  "price": 220,
  "validityDays": 30
}
```

**Sample responses**

`201` — Created

```json
{
  "status": "success",
  "data": {
    "id": 4
  }
}
```

### POST `/api/receptionist/cards` 🔒

**Issue Card** — Issue a card to a patient.

- **Auth:** Bearer (Receptionist)
- **Body:** JSON

**Request**

```http
POST {{baseUrl}}/api/receptionist/cards
Authorization: Bearer {{receptionistToken}}
Content-Type: application/json

{
  "patientId": 41,
  "templateId": 4,
  "isPaid": true
}
```

**Sample responses**

`201` — Issued

```json
{
  "status": "success",
  "data": {
    "id": 89
  }
}
```

### PATCH `/api/receptionist/appointments/reorder` 🔒

**Reorder Appointments** — Reorder today's queue for a doctor.

- **Auth:** Bearer (Receptionist)
- **Body:** JSON

**Request**

```http
PATCH {{baseUrl}}/api/receptionist/appointments/reorder
Authorization: Bearer {{receptionistToken}}
Content-Type: application/json

{
  "doctorId": 12,
  "date": "2026-09-25",
  "orderedSlots": [
    4101,
    4102,
    null
  ]
}
```

**Sample responses**

`200` — Reordered

```json
{
  "status": "success",
  "data": {
    "success": true
  }
}
```

## Legal Pages

### GET `/api/legal/privacy` 

**Privacy Policy (HTML)** — Rendered privacy policy page.

- **Auth:** None
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/legal/privacy
```

**Sample responses**

`200` — HTML page

```json
<html>...</html>
```

### GET `/api/legal/terms` 

**Terms of Use (HTML)** — Rendered terms page.

- **Auth:** None
- **Body:** None

**Request**

```http
GET {{baseUrl}}/api/legal/terms
```

**Sample responses**

`200` — HTML page

```json
<html>...</html>
```
