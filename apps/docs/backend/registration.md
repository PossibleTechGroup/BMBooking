# 🔐 BM Booking — Complete Registration & Onboarding Documentation

This is the **single source of truth** for the frontend team. It covers the entire user journey from app launch to a fully active account — including OTP authentication, profile setup, admin review, rejection/resubmission, and every edge case with exact error messages.

---

## 📋 Table of Contents

1. [Full Journey Flowchart](#-full-journey-flowchart)
2. [Phase 1 — OTP Authentication](#-phase-1--otp-authentication)
3. [Phase 2 — Doctor Profile Setup](#-phase-2--doctor-profile-setup)
4. [Phase 3 — Admin Review & Status Polling](#-phase-3--admin-review--status-polling)
5. [Phase 4 — Rejection & Resubmission](#-phase-4--rejection--resubmission)
6. [Phase 5 — Post-Approval (Payment & Availability)](#-phase-5--post-approval-payment--availability)
7. [Complete Error Reference](#-complete-error-reference)
8. [Frontend Implementation Guide](#-frontend-implementation-guide)
9. [Development & Debugging](#-development--debugging)

---

## 🗺️ Full Journey Flowchart

```mermaid
flowchart TD
    START([App Launch]) --> SESSION{Existing JWT token?}

    SESSION -->|Yes| STATUSCHECK{Check profile status}
    SESSION -->|No| PHONE([Enter phone number])

    STATUSCHECK -->|No profile| PROFILESETUP([Profile setup])
    STATUSCHECK -->|PendingReview| PENDING([Waiting for admin])
    STATUSCHECK -->|Approved| HOME([Doctor Dashboard])
    STATUSCHECK -->|Rejected| REJECTED([Show rejection reason])

    PHONE -->|POST /api/auth/request-otp| OTPSEND{OTP sent?}
    OTPSEND -->|Success| OTPINPUT([Enter 4-digit code])
    OTPSEND -->|Already registered| ERROR_DUP([Show: already registered])
    OTPSEND -->|Role conflict| ERROR_ROLE([Show: wrong role])

    OTPINPUT -->|POST /api/auth/verify-otp| OTPCHECK{Validate OTP}
    OTPCHECK -->|Valid| PROFILESETUP
    OTPCHECK -->|Invalid| OTPINVALID([Show: Invalid OTP])
    OTPCHECK -->|Expired| OTPEXPIRED([Show: OTP expired])
    OTPCHECK -->|Already used| OTPUSED([Show: code already used])

    OTPINVALID --> RETRY{Attempts < 5?}
    RETRY -->|Yes| OTPINPUT
    RETRY -->|No| LOCKED([Account locked 30min])

    OTPEXPIRED --> PHONE

    PROFILESETUP -->|POST /api/doctors/profile| PENDING
    REJECTED --> EDITPROFILE([Edit & fix profile])
    EDITPROFILE -->|POST /api/doctors/profile| PENDING

    PENDING -->|Poll: GET /api/doctors/profile| ADMINCHECK{Admin decision}
    ADMINCHECK -->|Approved| HOME
    ADMINCHECK -->|Rejected| REJECTED

    style HOME fill:#E1F5EE,stroke:#0F6E56,color:#085041
    style PENDING fill:#FAEEDA,stroke:#854F0B,color:#633806
    style LOCKED fill:#FCEBEB,stroke:#A32D2D,color:#791F1F
    style REJECTED fill:#FCEBEB,stroke:#A32D2D,color:#791F1F
    style ERROR_DUP fill:#FCEBEB,stroke:#A32D2D,color:#791F1F
    style ERROR_ROLE fill:#FCEBEB,stroke:#A32D2D,color:#791F1F
    style OTPINVALID fill:#FCEBEB,stroke:#A32D2D,color:#791F1F
    style OTPEXPIRED fill:#FCEBEB,stroke:#A32D2D,color:#791F1F
    style OTPUSED fill:#FCEBEB,stroke:#A32D2D,color:#791F1F
```

---

## 🔑 Phase 1 — OTP Authentication

### Step 1: Request OTP

Sends a 4-digit SMS code to the user's phone via GeezSMS.

- **Endpoint**: `POST /api/auth/request-otp`
- **Headers**: `Content-Type: application/json`

#### Request Body

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `phone` | String | ✅ Yes | Ethiopian format: `+251911223344` |
| `role` | String | ✅ Yes | `"patient"` or `"doctor"` |
| `isRegistration` | Boolean | No | `true` for signup, `false` for login (default: `false`) |

#### ✅ Success (200)
```json
{
  "status": "success",
  "data": {
    "status": "success",
    "message": "OTP sent successfully"
  }
}
```

#### ❌ Errors

| Scenario | Status | Response |
| :--- | :--- | :--- |
| **Duplicate registration** | 400 | `"This phone number is already registered. Please log in instead."` |
| **Role conflict** | 400 | `"This phone number is already registered as a patient. Please log in using that role."` |
| **Invalid phone format** | 400 | `"Phone number must be a valid Ethiopian number (+251...)"` |
| **Missing fields** | 400 | `"Phone and role are required"` |
| **Invalid role** | 400 | `"\"role\" must be one of [patient, doctor]"` |

---

### Step 2: Verify OTP

Validates the 4-digit code. On success, creates the user account (if new) and returns a JWT token valid for **90 days**.

- **Endpoint**: `POST /api/auth/verify-otp`
- **Headers**: `Content-Type: application/json`

#### Request Body

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `phone` | String | ✅ Yes | Same number from Step 1 |
| `code` | String | ✅ Yes | The 4-digit SMS code |
| `role` | String | ✅ Yes | Must match the role from Step 1 |
| `isRegistration` | Boolean | No | `true` for signup (default: `false`) |

#### ✅ Success (200)
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": {
      "id": 12,
      "phone": "+251911223344",
      "role": "doctor",
      "isLocked": false,
      "lockedUntil": null,
      "createdAt": "2026-05-11T12:00:00.000Z"
    }
  }
}
```

> [!TIP]
> Store the `token` securely using `EncryptedStorage` on mobile. Include it in all subsequent requests as `Authorization: Bearer <token>`.

#### ❌ Errors

| Scenario | Status | Response |
| :--- | :--- | :--- |
| **Already registered** | 400 | `"This phone number is already registered. Please log in instead."` |
| **Role conflict** | 400 | `"Account exists with role 'patient'. You cannot register or log in as 'doctor'."` |
| **Wrong code** | 400 | `"Invalid OTP"` |
| **Code already used** | 400 | `"This code has already been used. Please request a new one."` |
| **Code expired** | 400 | `"OTP expired"` |
| **Account locked** | 400 | `"Account locked. Try again in X minutes."` |
| **Too many attempts** | 400 | `"Too many attempts. Account locked for 30 minutes."` |

---

## 🩺 Phase 2 — Doctor Profile Setup

After OTP verification, doctors must submit their professional profile. Patients skip this phase entirely.

- **Endpoint**: `POST /api/doctors/profile`
- **Headers**: `Content-Type: multipart/form-data`, `Authorization: Bearer <token>`

#### Request Body (Multipart Form-Data)

| Field | Type | Required | Validation | Description |
| :--- | :--- | :--- | :--- | :--- |
| `fullName` | String | ✅ Yes | 3–100 chars | Doctor's full name |
| `specialization` | String | ✅ Yes | 2–100 chars | e.g. `"Cardiology"` |
| `experienceYears` | Number | ✅ Yes | 0–60 | Years of experience |
| `bio` | String | ✅ Yes | 10–1000 chars | Professional biography |
| `licenseNumber` | String | ✅ Yes | — | Medical license ID |
| `clinicName` | String | No | max 100 chars | Name of clinic |
| `clinicAddress` | String | No | max 200 chars | Clinic location |
| `appointmentFee` | Number | No | min 0 | Fee per appointment |
| `languages` | JSON Array | No | — | e.g. `["Amharic","English"]` |
| `profilePicture` | File | No | Image | Doctor's photo |
| `introVideo` | File | No | Video | Introduction video |

#### ✅ Success (200)
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "userId": 12,
    "fullName": "Dr. Abel Tesfaye",
    "specialization": "Cardiology",
    "experienceYears": 10,
    "bio": "Experienced cardiologist with 10 years...",
    "licenseNumber": "LC-123456",
    "status": "PendingReview",
    "createdAt": "2026-05-11T12:00:00.000Z"
  }
}
```

#### ❌ Errors

| Scenario | Status | Response |
| :--- | :--- | :--- |
| **Missing required field** | 400 | `"Validation Error: \"fullName\" is required"` |
| **Bio too short** | 400 | `"Validation Error: \"bio\" length must be at least 10 characters long"` |
| **No auth token** | 401 | `"No token provided"` |
| **Invalid token** | 401 | `"Invalid token"` |

---

## 🛡️ Phase 3 — Admin Review & Status Polling

After profile submission, the doctor's status is `PendingReview`. The frontend must poll for updates.

### Check Profile Status

- **Endpoint**: `GET /api/doctors/profile`
- **Headers**: `Authorization: Bearer <token>`

#### ✅ Success — Pending (200)
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "fullName": "Dr. Abel Tesfaye",
    "status": "PendingReview",
    "rejectionReason": null
  }
}
```

#### ✅ Success — Approved (200)
```json
{
  "status": "success",
  "data": {
    "status": "Approved",
    "fullName": "Dr. Abel Tesfaye",
    "rejectionReason": null
  }
}
```

#### ✅ Success — Rejected (200)
```json
{
  "status": "success",
  "data": {
    "status": "Rejected",
    "fullName": "Dr. Abel Tesfaye",
    "rejectionReason": "License number could not be verified. Please upload a clearer image."
  }
}
```

#### ❌ Errors

| Scenario | Status | Response |
| :--- | :--- | :--- |
| **No profile yet** | 404 | `"Profile not found"` |
| **No auth token** | 401 | `"No token provided"` |

### Polling Implementation

```javascript
// On the "Pending Review" screen, poll every 30 seconds
const pollInterval = setInterval(async () => {
  try {
    const res = await api.get('/api/doctors/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const { status, rejectionReason } = res.data.data;

    if (status === 'Approved') {
      clearInterval(pollInterval);
      navigation.replace('DoctorDashboard');
    } else if (status === 'Rejected') {
      clearInterval(pollInterval);
      showRejectionScreen(rejectionReason);
    }
    // If still 'PendingReview', do nothing — keep polling
  } catch (err) {
    console.error('Polling error:', err);
  }
}, 30000);

// IMPORTANT: Clear interval when screen unmounts
return () => clearInterval(pollInterval);
```

### Profile Status Values

| Status | Meaning | Frontend Action |
| :--- | :--- | :--- |
| `PendingReview` | Submitted, waiting for admin | Show "Under Review" screen, keep polling |
| `Approved` | Account activated | Navigate to Doctor Dashboard |
| `Rejected` | Admin rejected the profile | Show rejection reason + "Edit Profile" button |

---

## 🔄 Phase 4 — Rejection & Resubmission

If the admin rejects a doctor's profile, the doctor can edit and resubmit.

### How Resubmission Works

1. The frontend calls `GET /api/doctors/profile` to get the current data + `rejectionReason`.
2. The doctor edits the fields that need fixing.
3. The frontend calls `POST /api/doctors/profile` again with the updated data.
4. The backend **updates** the existing profile and **resets** the status to `PendingReview`.
5. The polling cycle starts again.

> [!IMPORTANT]
> The `POST /api/doctors/profile` endpoint is an **upsert**. If a profile exists, it updates it. If not, it creates one. On update, the status is automatically reset to `PendingReview`.

---

## 💳 Phase 5 — Post-Approval (Payment & Availability)

> [!NOTE]
> These endpoints are planned but **not yet implemented** in the backend. This section documents the expected flow from the sequence diagram for future development.

After approval, the doctor must complete:

1. **Payment Methods Setup** — Configure how they receive payments.
2. **Availability Schedule** — Set their working hours and available appointment slots.

Once both are complete, the doctor account becomes **fully active** and appears in patient search results.

---

## 🚨 Complete Error Reference

Every possible error the frontend can receive, organized by endpoint:

### `POST /api/auth/request-otp`

| Error Message | When It Happens |
| :--- | :--- |
| `"Phone and role are required"` | Missing `phone` or `role` in body |
| `"Phone number must be a valid Ethiopian number (+251...)"` | Phone doesn't match `+251[79]XXXXXXXX` |
| `"\"role\" must be one of [patient, doctor]"` | Role is not `patient` or `doctor` |
| `"This phone number is already registered. Please log in instead."` | `isRegistration: true` but user exists |
| `"This phone number is already registered as a {role}. Please log in using that role."` | Phone exists with a different role |

### `POST /api/auth/verify-otp`

| Error Message | When It Happens |
| :--- | :--- |
| `"Phone, code, and role are required"` | Missing required fields |
| `"This phone number is already registered. Please log in instead."` | `isRegistration: true` but user exists |
| `"Account exists with role '{role}'. You cannot register or log in as '{other_role}'."` | Role mismatch |
| `"Invalid OTP"` | Wrong code entered |
| `"This code has already been used. Please request a new one."` | OTP was already verified |
| `"OTP expired"` | Code is older than 5 minutes |
| `"Too many attempts. Account locked for 30 minutes."` | 5 failed attempts |
| `"Account locked. Try again in X minutes."` | Account is currently locked |

### `POST /api/doctors/profile`

| Error Message | When It Happens |
| :--- | :--- |
| `"Validation Error: ..."` | Any field fails Joi validation |
| `"No token provided"` | Missing `Authorization` header |
| `"Invalid token"` | Expired or malformed JWT |

### `GET /api/doctors/profile`

| Error Message | When It Happens |
| :--- | :--- |
| `"Profile not found"` | Doctor hasn't submitted a profile yet |
| `"No token provided"` | Missing `Authorization` header |

---

## 🛠️ Frontend Implementation Guide

### Phone Number Validation (Client-Side)

Apply this regex before sending the request to avoid unnecessary API calls:
```javascript
const isValidPhone = /^\+251[79]\d{8}$/.test(phone);
```
- Must start with `+251`
- Followed by `7` or `9`
- Then exactly 8 digits
- Total length: 13 characters

### Registration vs Login

| Screen | `isRegistration` value |
| :--- | :--- |
| **Signup / Register** | `true` |
| **Login / Sign In** | `false` (or omit the field) |

### JWT Token Usage

Include in all protected requests:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

The token expires after **90 days**. If the server returns `401`, redirect the user to the login screen.

### App Launch Logic

```javascript
async function onAppLaunch() {
  const token = await EncryptedStorage.getItem('token');
  const role = await EncryptedStorage.getItem('role');

  if (!token) {
    // No session → show Login/Register screen
    return navigation.replace('Auth');
  }

  if (role === 'patient') {
    // Patients go straight to home
    return navigation.replace('PatientHome');
  }

  if (role === 'doctor') {
    try {
      const res = await api.get('/api/doctors/profile');
      const status = res.data.data.status;

      if (status === 'Approved') navigation.replace('DoctorDashboard');
      else if (status === 'PendingReview') navigation.replace('PendingScreen');
      else if (status === 'Rejected') navigation.replace('RejectedScreen');
    } catch (err) {
      if (err.response?.status === 404) {
        // No profile yet → show profile setup
        navigation.replace('DoctorProfileSetup');
      }
    }
  }
}
```

---

## 🔧 Development & Debugging

### OTP Debugging

The backend logs every OTP to the console. Check Docker logs:
```bash
docker-compose logs -f app
```
Look for:
```
[GeezSMS] Response for +251911223344: { ... }
```

### Test Phone Numbers

| Phone | Role | Purpose |
| :--- | :--- | :--- |
| `+251911223344` | `doctor` | Doctor registration flow |
| `+251999887766` | `patient` | Patient registration flow |

### Postman Collection

All endpoints and edge cases are available in `docs/api-collections/bm-postman.json`. Import it into Postman and set `baseUrl` to `http://localhost:5000`.
