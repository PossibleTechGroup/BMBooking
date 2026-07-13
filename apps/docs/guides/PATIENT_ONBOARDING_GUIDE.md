# 🏥 Patient Onboarding Documentation

This document outlines the workflow and technical implementation for onboarding new patients into the BM Booking ecosystem.

---

## 🚀 The Onboarding Flow

1.  **OTP Verification**: User enters their phone number and verifies via OTP.
2.  **Profile Detection**: The app checks if a `PatientProfile` exists for this user ID.
3.  **Redirection**:
    *   **New Patient**: Redirected to `/(patient-onboarding)/setup`.
    *   **Existing Patient**: Redirected to `/(tabs)`.
4.  **Profile Setup**: Patient completes the health profile form.
5.  **Access Granted**: Once saved, the user gains access to the appointment booking system.

---

## 📋 Data Collection Fields

We collect essential health information to help doctors provide better care:

| Field | Required | Type | Description |
| :--- | :--- | :--- | :--- |
| **Full Name** | Yes | String | Legal name for medical records. |
| **Date of Birth** | Yes | Date | Used for calculating age and medical dosage. |
| **Gender** | Yes | String | Male, Female, or Other. |
| **Blood Type** | No | String | Critical for emergency situations (e.g., A+, O-). |
| **Emergency Contact** | No | Phone | Primary contact person in case of medical crisis. |

---

## ⚙️ Technical Implementation (Mobile)

### Redux State: `patientSlice`
Managed in `store/slices/patientSlice.ts`.
- **`profile`**: Stores the current patient data.
- **`loading`**: Boolean flag for API calls.
- **`error`**: Stores custom error messages for the UI banner.

### API Integration
- **Fetch Profile**: `GET /api/patients/profile`
- **Setup/Update Profile**: `POST /api/patients/profile`

---

## 🖥️ Backend Logic

The backend uses a one-to-one relationship between the `User` and `PatientProfile`.

**Database Schema (Prisma):**
```prisma
model PatientProfile {
  id              Int      @id @default(autoincrement())
  userId          Int      @unique
  fullName        String?
  dateOfBirth     DateTime?
  gender          String?
  bloodType       String?
  emergencyContact String?
}
```

---

## 🎨 UI/UX Standards
- **Validation**: Full Name and DOB are strictly enforced.
- **Feedback**: Uses the `MedInput` error states and a top-level **Premium Error Banner** for missing fields.
- **Navigation**: Uses `router.replace` after success to prevent users from navigating "back" into the onboarding flow.

> [!TIP]
> For testing purposes, you can reset a patient's onboarding status by deleting their entry in the `patient_profiles` table in the database.
