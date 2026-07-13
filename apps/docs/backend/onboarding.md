# 🚀 BM Booking Onboarding & Maintenance Guide

This guide explains how to manage the doctor onboarding flow and how to perform maintenance tasks like wiping the database.

---

## 🩺 Part 1: Doctor Profile Creation Flow

For a doctor to become active on BM Booking, they must follow these three steps:

### 1. Authentication (OTP)
*   **Action**: User enters their phone number and selects "Doctor" role.
*   **Endpoint**: `POST /api/auth/request-otp`
*   **Action**: User enters the 4-digit code received via SMS.
*   **Endpoint**: `POST /api/auth/verify-otp`
*   **Result**: The user is now authenticated and receives a **JWT Token**.

### 2. Professional Profile Submission
*   **Action**: The doctor fills out their professional details.
*   **Endpoint**: `POST /api/doctors/profile`
*   **Required Fields**: 
    - Full Name, Specialization, Experience (Years), Bio, License Number.
*   **Optional Fields**: 
    - Profile Picture, Intro Video, Clinic Name/Address, Appointment Fee, Languages.
*   **Result**: The doctor's status is set to `PendingReview`.

### 3. Admin Approval
*   **Action**: An admin reviews the credentials (license, bio, etc.).
*   **Action**: Admin approves or rejects the profile.
*   **Endpoint**: `GET /api/doctors/profile` (Polled by the mobile app).
*   **Result**: If approved, the doctor can now set their availability and receive bookings.

---

## 🧹 Part 2: Wiping the Database & Starting Fresh

Use these commands whenever you want to clear test data and start with a clean slate.

### Method 1: The "Nuclear" Option (Recommended)
This is the most reliable method. It deletes the database, all tables, all users, and all uploaded files (profile pictures/videos).
```bash
# 1. Stop the containers and delete all virtual volumes/data
docker-compose down -v

# 2. Start everything back up and rebuild
docker-compose up --build
```

### Method 2: Reset Records Only (Prisma)
Use this if you want to keep your uploaded files but delete all users and profiles from the database.
```bash
# From the backend folder:
docker-compose exec app npx prisma migrate reset
```
*Note: This will ask for confirmation. Type `y` to proceed.*

### Method 3: Force Sync Schema
Use this if you have modified `schema.prisma` and want to force the database to match the new schema, wiping all data in the process.
```bash
# From the backend folder:
docker-compose exec app npx prisma db push --force-reset
```

---

## 🧪 Quick Test: Is my server running correctly?

After a database wipe, you can verify everything is working by checking the health endpoint:
```bash
curl http://localhost:5000/health
```
**Expected Response:**
```json
{
  "status": "success",
  "message": "BM Booking Backend is running",
  "timestamp": "..."
}
```
