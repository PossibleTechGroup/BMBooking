/**
 * One source of truth for the BM Booking API surface (route files under
 * apps/backend/src/routes + controller response shapes).
 *
 * Generates two artifacts in apps/docs/api-collections/:
 *   1. bm-booking-openapi.json  -> OpenAPI 3.0.3 spec (importable into Postman)
 *   2. BM-Booking-API.md        -> Postman-style reference with real sample
 *                                  requests and responses
 *
 * Usage: node scripts/generate-api-docs.js
 */
const fs = require("fs");
const path = require("path");

const OUT_DIR = __dirname;

const BASE = "http://localhost:5000";
const ENV = [
  { key: "baseUrl", value: BASE, type: "string" },
  { key: "patientToken", value: "", type: "string" },
  { key: "doctorToken", value: "", type: "string" },
  { key: "adminToken", value: "", type: "string" },
  { key: "hospitalToken", value: "", type: "string" },
  { key: "receptionistToken", value: "", type: "string" },
  { key: "txRef", value: "", type: "string" },
];

const AUTH_LABEL = {
  none: "None",
  patient: "Bearer (Patient)",
  doctor: "Bearer (Doctor)",
  admin: "Bearer (Admin)",
  hospital: "Bearer (Hospital Portal owner/staff)",
  receptionist: "Bearer (Receptionist)",
};

// ---------------------------------------------------------------------------
// Endpoint definitions
// ---------------------------------------------------------------------------

const GROUPS = [];

function group(name, endpoints) {
  GROUPS.push({ name, endpoints });
}

group("Auth", [
  {
    name: "Request OTP",
    method: "POST",
    path: "/api/auth/request-otp",
    auth: "none",
    summary:
      "Send a 6-digit verification code to an Ethiopian phone number. With MOCK_OTP=true the demo code is returned in mockCode. Existing users do not need a role; new users must pass role.",
    body: {
      mode: "json",
      value: {
        phone: "+251911223344",
        role: "doctor",
        isRegistration: true,
      },
    },
    responses: [
      {
        status: 200,
        desc: "OTP sent (mock mode returns the code)",
        example: {
          status: "success",
          message: "OTP sent successfully",
          mockCode: "482913",
        },
      },
      {
        status: 400,
        desc: "Already registered",
        example: {
          status: "fail",
          message: "This phone number is already registered. Please log in instead.",
        },
      },
    ],
  },
  {
    name: "Verify OTP",
    method: "POST",
    path: "/api/auth/verify-otp",
    auth: "none",
    summary:
      "Verify the OTP code and obtain a JWT token (valid 90 days). Stores the token in {{patientToken}}/{{doctorToken}}.",
    body: {
      mode: "json",
      value: {
        phone: "+251911223344",
        code: "482913",
        role: "doctor",
        isRegistration: true,
      },
    },
    responses: [
      {
        status: 200,
        desc: "Login success — token + user",
        example: {
          status: "success",
          data: {
            token:
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDIsInBob25lIjoiKzI1MTkxMTIyMzM0NCIsInJvbGUiOiJkb2N0b3IiLCJpYXQiOjE3MzAwMDAwMDAsImV4cCI6MTc5MDI1MjQwMH0.aaaBbBcCc",
            user: {
              id: 42,
              phone: "+251911223344",
              role: "doctor",
              isLocked: false,
              createdAt: "2026-09-20T08:12:33.000Z",
            },
          },
        },
      },
      {
        status: 400,
        desc: "Invalid OTP / locked / reused",
        example: { status: "fail", message: "Invalid OTP" },
      },
    ],
  },
  {
    name: "Receptionist Login",
    method: "POST",
    path: "/api/auth/receptionist-login",
    auth: "none",
    summary: "Login for receptionist staff (username + password).",
    body: {
      mode: "json",
      value: { username: "r_kirkos", password: "Reception@2026" },
    },
    responses: [
      {
        status: 200,
        desc: "Login success",
        example: {
          status: "success",
          data: {
            token:
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjIsInVzZXJuYW1lIjoicl9raXJrb3MiLCJyb2xlIjoicmVjZXB0aW9uaXN0IiwiaG9zcGl0YWxJZCI6MywiaWF0IjoxNzMwMDAwMDAwfQ.aaaBbBcCc",
            user: {
              id: 22,
              username: "r_kirkos",
              role: "receptionist",
              hospitalRole: "staff",
              hospitalId: 3,
              permissions: ["appointments.view", "patients.create"],
            },
          },
        },
      },
      {
        status: 400,
        desc: "Bad credentials",
        example: { status: "fail", message: "Invalid username or password" },
      },
    ],
  },
  {
    name: "Hospital Login",
    method: "POST",
    path: "/api/auth/hospital-login",
    auth: "none",
    summary: "Legacy hospital owner login (phone + password).",
    body: {
      mode: "json",
      value: { phone: "+251911223344", password: "Hospital@2026" },
    },
    responses: [
      {
        status: 200,
        desc: "Login success",
        example: {
          status: "success",
          data: {
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            user: {
              id: 3,
              phone: "+251911223344",
              role: "hospital",
              hospitalRole: "owner",
              hospitalId: 3,
            },
          },
        },
      },
    ],
  },
  {
    name: "Hospital Portal Login",
    method: "POST",
    path: "/api/auth/hospital-portal-login",
    auth: "none",
    summary:
      "Unified login for the hospital portal. identifier can be a phone number, username, or email. Works for owners (role hospital) and staff (role receptionist).",
    body: {
      mode: "json",
      value: { identifier: "admin@kirkos-hospital.com", password: "Hospital@2026" },
    },
    responses: [
      {
        status: 200,
        desc: "Portal login success",
        example: {
          status: "success",
          data: {
            token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            user: {
              id: 3,
              phone: "+251911223344",
              role: "hospital",
              hospitalRole: "owner",
              hospitalId: 3,
              permissions: ["*"],
            },
          },
        },
      },
    ],
  },
  {
    name: "Register Push Token",
    method: "POST",
    path: "/api/auth/push-token",
    auth: "patient",
    summary: "Register an Expo push token so the user receives push notifications.",
    body: { mode: "json", value: { token: "ExponentPushToken[xxxx-xxxx-xxxx-xxxx]" } },
    responses: [
      {
        status: 200,
        desc: "OK",
        example: { status: "success", message: "Push token registered" },
      },
    ],
  },
  {
    name: "Delete My Account",
    method: "DELETE",
    path: "/api/auth/account",
    auth: "patient",
    summary:
      "Soft-deletes the account and anonymizes personal data (App Store / Play requirement). Releases the phone number.",
    responses: [
      {
        status: 200,
        desc: "Deleted",
        example: {
          status: "success",
          message: "Account deleted successfully",
          data: { id: 42, deletedAt: "2026-09-21T10:00:00.000Z" },
        },
      },
    ],
  },
]);

group("Doctors", [
  {
    name: "List All Doctors",
    method: "GET",
    path: "/api/doctors/all",
    auth: "none",
    summary: "Public — all approved doctors with availability and hospital info.",
    responses: [
      {
        status: 200,
        desc: "Doctor list",
        example: {
          status: "success",
          data: [
            {
              id: 12,
              userId: 42,
              fullName: "Dr. Abel Tesfaye",
              profilePicture:
                "https://res.cloudinary.com/xxx/image/upload/v1/doctor_profiles/ab.jpg",
              specialization: "Cardiology",
              specializations: ["Cardiology", "Internal Medicine"],
              licenseNumber: "LC-123456",
              experienceYears: 10,
              bio: "Consultant cardiologist with 10 years of experience.",
              clinicName: "Kirkos Heart Center",
              clinicAddress: "Bole Road, Addis Ababa",
              languages: ["Amharic", "English"],
              baseHourlyRate: 500,
              status: "Approved",
              rating: 4.8,
              totalReviews: 23,
              hospital: {
                id: 3,
                name: "Kirkos General Hospital",
                address: "Kirkos, Addis Ababa",
                image: "https://res.cloudinary.com/xxx/.../hospitals/kirkos.jpg",
                latitude: 9.0108,
                longitude: 38.7612,
              },
              availability: { isAvailable: true, nextAvailableSlot: "2026-09-22T06:30:00.000Z" },
              createdAt: "2026-08-01T09:00:00.000Z",
            },
          ],
        },
      },
    ],
  },
  {
    name: "Search Doctors",
    method: "GET",
    path: "/api/doctors/search",
    auth: "none",
    summary: "Public — search/filter doctors.",
    query: [
      { name: "specialty", example: "Cardiology" },
      { name: "minRating", example: "4.0" },
      { name: "name", example: "Abel" },
    ],
    responses: [
      {
        status: 200,
        desc: "Search result",
        example: { status: "success", data: [] },
      },
    ],
  },
  {
    name: "Get Doctor Schedules",
    method: "GET",
    path: "/api/doctors/{id}/schedules",
    auth: "none",
    summary: "Public — schedules for a doctor with optional date range filters.",
    params: [{ name: "id", type: "integer", desc: "Doctor profile ID" }],
    query: [
      { name: "date", example: "2026-09-25" },
      { name: "from", example: "2026-09-25T06:00:00.000Z" },
      { name: "to", example: "2026-09-25T18:00:00.000Z" },
    ],
    responses: [
      {
        status: 200,
        desc: "Schedule list with slots",
        example: {
          status: "success",
          data: [
            {
              id: 301,
              doctorId: 12,
              date: "2026-09-25T00:00:00.000Z",
              startTime: "2026-09-25T06:00:00.000Z",
              endTime: "2026-09-25T12:00:00.000Z",
              slotDuration: 30,
              maxPatientsPerSlot: 1,
              clinicRoom: "Room 204",
              isActive: true,
              slots: [
                {
                  id: 4101,
                  startTime: "2026-09-25T06:00:00.000Z",
                  endTime: "2026-09-25T06:30:00.000Z",
                  maxPatients: 1,
                },
              ],
            },
          ],
        },
      },
    ],
  },
  {
    name: "Get My Doctor Profile",
    method: "GET",
    path: "/api/doctors/profile",
    auth: "doctor",
    summary: "Get the authenticated doctor's profile.",
    responses: [
      {
        status: 200,
        desc: "Profile",
        example: {
          status: "success",
          data: {
            id: 12,
            userId: 42,
            fullName: "Dr. Abel Tesfaye",
            profilePicture: null,
            introVideo: null,
            specialization: "Cardiology",
            specializations: ["Cardiology"],
            licenseNumber: "LC-123456",
            experienceYears: 10,
            bio: "Consultant cardiologist with 10 years of experience.",
            clinicName: "Kirkos Heart Center",
            clinicAddress: "Bole Road, Addis Ababa",
            languages: ["Amharic", "English"],
            baseHourlyRate: 500,
            status: "PendingReview",
            rating: 0,
            totalReviews: 0,
            hospitalId: null,
            availability: [],
            createdAt: "2026-09-20T08:15:00.000Z",
          },
        },
      },
    ],
  },
  {
    name: "Setup Doctor Profile",
    method: "POST",
    path: "/api/doctors/profile",
    auth: "doctor",
    summary:
      "Complete registration by uploading the doctor profile (multipart/form-data). profilePicture and introVideo are file fields.",
    body: {
      mode: "formdata",
      fields: [
        ["fullName", "Dr. Abel Tesfaye"],
        ["specialization", "Cardiology"],
        ["specializations", '["Cardiology","Internal Medicine"]'],
        ["experienceYears", "10"],
        ["bio", "Consultant cardiologist with 10 years of experience."],
        ["clinicName", "Kirkos Heart Center"],
        ["clinicAddress", "Bole Road, Addis Ababa"],
        ["languages", '["Amharic","English"]'],
        ["licenseNumber", "LC-123456"],
        ["baseHourlyRate", "500"],
        ["profilePicture", "(file) photo.jpg"],
        ["introVideo", "(file) intro.mp4"],
      ],
    },
    responses: [
      {
        status: 200,
        desc: "Profile created",
        example: {
          status: "success",
          data: {
            id: 12,
            userId: 42,
            fullName: "Dr. Abel Tesfaye",
            profilePicture: "https://res.cloudinary.com/xxx/.../doctor_profiles/ab.jpg",
            status: "PendingReview",
          },
        },
      },
    ],
  },
  {
    name: "Update Doctor Profile",
    method: "PUT",
    path: "/api/doctors/profile",
    auth: "doctor",
    summary: "Update profile (multipart/form-data).",
    body: {
      mode: "formdata",
      fields: [
        ["bio", "Updated bio."],
        ["profilePicture", "(file) new-photo.jpg"],
      ],
    },
    responses: [
      { status: 200, desc: "Profile updated", example: { status: "success", data: { id: 12 } } },
    ],
  },
  {
    name: "Update Availability",
    method: "PUT",
    path: "/api/doctors/availability",
    auth: "doctor",
    summary: "Set the doctor's recurring weekly availability.",
    body: {
      mode: "json",
      value: {
        availability: [
          {
            day: "monday",
            startTime: "08:00",
            endTime: "12:00",
            location: "Kirkos Heart Center",
          },
          {
            day: "wednesday",
            startTime: "14:00",
            endTime: "17:00",
            location: "Clinic B",
          },
        ],
      },
    },
    responses: [
      { status: 200, desc: "Updated", example: { status: "success", data: { id: 12 } } },
    ],
  },
  {
    name: "Create Doctor Schedule",
    method: "POST",
    path: "/api/doctors/schedules",
    auth: "doctor",
    summary: "Create a schedule for a specific date/time window with generated slots.",
    body: {
      mode: "json",
      value: {
        date: "2026-09-25",
        startTime: "2026-09-25T06:00:00.000Z",
        endTime: "2026-09-25T09:00:00.000Z",
        slotDuration: 30,
        maxPatientsPerSlot: 1,
        clinicRoom: "Room 204",
        notes: "Morning clinic",
      },
    },
    responses: [
      {
        status: 201,
        desc: "Schedule created",
        example: { status: "success", data: { id: 301, doctorId: 12, isActive: true } },
      },
    ],
  },
]);

group("Patients", [
  {
    name: "Get My Patient Profile",
    method: "GET",
    path: "/api/patients/profile",
    auth: "patient",
    summary: "Get the authenticated patient profile.",
    responses: [
      {
        status: 200,
        desc: "Profile",
        example: {
          status: "success",
          data: {
            id: 9,
            userId: 41,
            fullName: "Sara Alemu",
            dateOfBirth: "1995-04-12",
            gender: "female",
            bloodType: "O+",
            emergencyContact: "+251911555666",
            createdAt: "2026-09-19T07:30:00.000Z",
          },
        },
      },
      {
        status: 404,
        desc: "Not set up yet",
        example: { status: "fail", message: "Patient profile not found" },
      },
    ],
  },
  {
    name: "Setup / Update Patient Profile",
    method: "POST",
    path: "/api/patients/profile",
    auth: "patient",
    summary: "Create or update the patient profile.",
    body: {
      mode: "json",
      value: {
        fullName: "Sara Alemu",
        gender: "female",
        dateOfBirth: "1995-04-12",
        bloodType: "O+",
        emergencyContact: "+251911555666",
      },
    },
    responses: [
      {
        status: 200,
        desc: "Saved",
        example: {
          status: "success",
          data: {
            id: 9,
            userId: 41,
            fullName: "Sara Alemu",
            gender: "female",
            dateOfBirth: "1995-04-12",
            bloodType: "O+",
            emergencyContact: "+251911555666",
          },
        },
      },
    ],
  },
  {
    name: "Check Phone (Book for Someone Else)",
    method: "POST",
    path: "/api/patients/check-phone",
    auth: "patient",
    summary: "Check whether a phone number already belongs to a patient before booking for someone else.",
    body: { mode: "json", value: { phone: "+251999887766" } },
    responses: [
      {
        status: 200,
        desc: "Existing patient",
        example: {
          status: "success",
          data: {
            exists: true,
            patient: {
              fullName: "Kebede Haile",
              gender: "male",
              dateOfBirth: "1980-01-01",
              bloodType: "B+",
            },
            registeredByMe: false,
          },
        },
      },
      {
        status: 200,
        desc: "Not registered yet",
        example: { status: "success", data: { exists: false } },
      },
    ],
  },
]);

group("Appointments — Patient", [
  {
    name: "Get Issue Categories",
    method: "GET",
    path: "/api/appointments/categories",
    auth: "none",
    summary: "Public — list of appointment issue categories.",
    responses: [
      {
        status: 200,
        desc: "Categories",
        example: {
          status: "success",
          data: ["General Checkup", "Cardiology", "Pediatrics", "Dermatology", "Orthopedics"],
        },
      },
    ],
  },
  {
    name: "Get Recommendations",
    method: "GET",
    path: "/api/appointments/recommendations/{category}",
    auth: "none",
    summary: "Public — recommended documents/doctors for a category.",
    params: [{ name: "category", type: "string", desc: "Issue category" }],
    responses: [
      {
        status: 200,
        desc: "Recommendations",
        example: {
          status: "success",
          data: { category: "Cardiology", recommendedDocs: ["ECG within 6 months"] },
        },
      },
    ],
  },
  {
    name: "Create Appointment",
    method: "POST",
    path: "/api/appointments",
    auth: "patient",
    summary:
      "Book an appointment. Passing a slotId validates slot capacity; paymentMethod may be 'service_fee' | 'full' | 'card'. A Telebirr payment of the fee must exist before a fee-bearing booking is accepted.",
    body: {
      mode: "json",
      value: {
        doctorId: 12,
        dateTime: "2026-09-25T06:30:00.000Z",
        fee: 500,
        reason: "Chest pain and palpitations",
        issueCategory: "Cardiology",
        notes: "First visit",
        slotId: 4101,
        paymentMethod: "service_fee",
        isPaid: true,
      },
    },
    responses: [
      {
        status: 201,
        desc: "Appointment created (auto-generates confirmation code and a hospital card if none exists)",
        example: {
          status: "success",
          data: {
            id: 1304,
            confirmationCode: "BM-8FD2A1",
            patientId: 41,
            doctorId: 12,
            slotId: 4101,
            cardId: 88,
            dateTime: "2026-09-25T06:30:00.000Z",
            fee: 500,
            reason: "Chest pain and palpitations",
            issueCategory: "Cardiology",
            notes: "First visit",
            status: "accepted",
            paymentMethod: "service_fee",
            isPaid: true,
          },
        },
      },
      {
        status: 400,
        desc: "Payment required",
        example: {
          status: "fail",
          message: "Payment of 500 ETB is required before booking. Please complete the Telebirr payment first.",
        },
      },
    ],
  },
  {
    name: "Upload Appointment Attachment",
    method: "POST",
    path: "/api/appointments/upload",
    auth: "patient",
    summary: "Upload a referral image; returns a Cloudinary URL.",
    body: { mode: "multipart", fields: [["file", "(file) referral.jpg"]] },
    responses: [
      {
        status: 200,
        desc: "Uploaded",
        example: {
          status: "success",
          data: { url: "https://res.cloudinary.com/xxx/.../appointments/ref.jpg" },
        },
      },
    ],
  },
  {
    name: "Get My Appointments",
    method: "GET",
    path: "/api/appointments/my",
    auth: "patient",
    summary: "All appointments for the authenticated patient.",
    responses: [
      {
        status: 200,
        desc: "Appointments",
        example: { status: "success", data: [{ id: 1304, confirmationCode: "BM-8FD2A1", status: "accepted" }] },
      },
    ],
  },
  {
    name: "Cancel Appointment",
    method: "PATCH",
    path: "/api/appointments/{id}/cancel",
    auth: "patient",
    summary: "Patient cancels their own appointment.",
    params: [{ name: "id", type: "integer", desc: "Appointment ID" }],
    responses: [
      {
        status: 200,
        desc: "Cancelled",
        example: { status: "success", data: { id: 1304, status: "cancelled" } },
      },
    ],
  },
  {
    name: "Reschedule Appointment",
    method: "PATCH",
    path: "/api/appointments/{id}/reschedule",
    auth: "patient",
    summary: "Move an appointment to a new date/time.",
    params: [{ name: "id", type: "integer", desc: "Appointment ID" }],
    body: { mode: "json", value: { dateTime: "2026-09-26T07:00:00.000Z", slotId: 4113 } },
    responses: [
      {
        status: 200,
        desc: "Rescheduled",
        example: { status: "success", data: { id: 1304, dateTime: "2026-09-26T07:00:00.000Z" } },
      },
    ],
  },
]);

group("Appointments — Doctor", [
  {
    name: "Get Doctor Appointments",
    method: "GET",
    path: "/api/appointments/doctor",
    auth: "doctor",
    summary: "Appointments for the authenticated doctor with filters.",
    query: [
      { name: "status", example: "accepted" },
      { name: "date", example: "2026-09-25" },
      { name: "from", example: "2026-09-25T06:00:00.000Z" },
      { name: "to", example: "2026-09-25T18:00:00.000Z" },
    ],
    responses: [
      {
        status: 200,
        desc: "Appointments",
        example: { status: "success", data: [{ id: 1304, confirmationCode: "BM-8FD2A1", status: "accepted" }] },
      },
    ],
  },
  {
    name: "Get Calendar Data",
    method: "GET",
    path: "/api/appointments/doctor/calendar",
    auth: "doctor",
    summary: "Appointment counts per day for a month.",
    query: [
      { name: "month", example: "9" },
      { name: "year", example: "2026" },
    ],
    responses: [
      {
        status: 200,
        desc: "Calendar",
        example: { status: "success", data: { "2026-09-25": 4, "2026-09-26": 2 } },
      },
    ],
  },
  {
    name: "Export Patient List",
    method: "GET",
    path: "/api/appointments/doctor/export",
    auth: "doctor",
    summary: "Patient list for a date, formatted for export.",
    query: [{ name: "date", example: "2026-09-25" }],
    responses: [
      { status: 200, desc: "Export data", example: { status: "success", data: [] } },
    ],
  },
  {
    name: "Get Doctor Stats",
    method: "GET",
    path: "/api/appointments/doctor/stats",
    auth: "doctor",
    summary: "Quick dashboard stats.",
    responses: [
      {
        status: 200,
        desc: "Stats",
        example: {
          status: "success",
          data: {
            totalAppointments: 120,
            pending: 8,
            accepted: 45,
            completed: 55,
            cancelled: 12,
            totalRevenue: 38400,
          },
        },
      },
    ],
  },
  {
    name: "Accept Appointment",
    method: "PATCH",
    path: "/api/appointments/{id}/accept",
    auth: "doctor",
    summary: "Accept a pending appointment.",
    params: [{ name: "id", type: "integer", desc: "Appointment ID" }],
    responses: [
      { status: 200, desc: "Accepted", example: { status: "success", data: { id: 1304, status: "accepted" } } },
    ],
  },
  {
    name: "Decline Appointment",
    method: "PATCH",
    path: "/api/appointments/{id}/decline",
    auth: "doctor",
    summary: "Decline an appointment with a reason.",
    params: [{ name: "id", type: "integer", desc: "Appointment ID" }],
    body: { mode: "json", value: { reason: "Doctor is unavailable on that date" } },
    responses: [
      { status: 200, desc: "Declined", example: { status: "success", data: { id: 1304, status: "declined" } } },
    ],
  },
  {
    name: "Complete Appointment",
    method: "PATCH",
    path: "/api/appointments/{id}/complete",
    auth: "doctor",
    summary: "Mark an accepted appointment as completed.",
    params: [{ name: "id", type: "integer", desc: "Appointment ID" }],
    responses: [
      { status: 200, desc: "Completed", example: { status: "success", data: { id: 1304, status: "completed" } } },
    ],
  },
  {
    name: "Create Follow-up",
    method: "POST",
    path: "/api/appointments/{id}/follow-up",
    auth: "doctor",
    summary: "Schedule a follow-up appointment from a completed consultation.",
    params: [{ name: "id", type: "integer", desc: "Appointment ID" }],
    body: {
      mode: "json",
      value: {
        dateTime: "2026-10-05T07:00:00.000Z",
        reason: "Follow-up after test results",
        issueCategory: "Cardiology",
        notes: "Bring ECG results",
      },
    },
    responses: [
      {
        status: 201,
        desc: "Follow-up created",
        example: { status: "success", data: { id: 1310, confirmationCode: "BM-77C0A1", status: "accepted" } },
      },
    ],
  },
]);

group("Medical Equipment", [
  {
    name: "Search Equipment",
    method: "GET",
    path: "/api/equipment/search",
    auth: "none",
    summary: "Public — search medical equipment. Supports Amharic category translations.",
    query: [
      { name: "category", example: "CT_SCAN" },
      { name: "hospitalId", example: "3" },
      { name: "city", example: "Addis Ababa" },
      { name: "isOperational", example: "true" },
      { name: "query", example: "CT" },
    ],
    responses: [
      {
        status: 200,
        desc: "Equipment list",
        example: {
          status: "success",
          data: [
            {
              id: 21,
              name: "Siemens CT Scanner",
              category: "CT_SCAN",
              hospitalId: 3,
              price: 3500,
              currency: "ETB",
              duration: 30,
              isOperational: true,
              description: "64-slice CT scanner",
              photo: "https://res.cloudinary.com/xxx/.../equipment/ct.jpg",
              city: "Addis Ababa",
              operatingHours: {
                monday: { start: "08:00", end: "17:00", duration: 30, enabled: true },
                tuesday: { start: "08:00", end: "17:00", duration: 30, enabled: true },
              },
              hospital: {
                id: 3,
                name: "Kirkos General Hospital",
                address: "Kirkos, Addis Ababa",
                phone: "+251116183000",
                latitude: 9.0108,
                longitude: 38.7612,
                cardPrice: 200,
                serviceFee: { amount: 50 },
              },
            },
          ],
        },
      },
    ],
  },
  {
    name: "Get Equipment Categories",
    method: "GET",
    path: "/api/equipment/categories",
    auth: "none",
    summary: "Public — valid equipment categories.",
    responses: [
      {
        status: 200,
        desc: "Categories",
        example: {
          status: "success",
          data: ["MRI", "CT_SCAN", "DIALYSIS", "ULTRASOUND", "XRAY", "VENTILATOR", "ECG", "MAMMOGRAPHY", "DEFIBRILLATOR", "OTHER"],
        },
      },
    ],
  },
  {
    name: "Get Hospital Equipment",
    method: "GET",
    path: "/api/equipment/hospital/{id}",
    auth: "none",
    summary: "Public — all operational equipment for a hospital.",
    params: [{ name: "id", type: "integer", desc: "Hospital ID" }],
    responses: [{ status: 200, desc: "Equipment", example: { status: "success", data: [] } }],
  },
  {
    name: "Get Equipment Detail",
    method: "GET",
    path: "/api/equipment/detail/{id}",
    auth: "none",
    summary: "Public — detailed equipment with operating hours.",
    params: [{ name: "id", type: "integer", desc: "Equipment ID" }],
    responses: [{ status: 200, desc: "Detail", example: { status: "success", data: { id: 21, name: "Siemens CT Scanner" } } }],
  },
  {
    name: "Get Equipment Announcements",
    method: "GET",
    path: "/api/equipment/announcements",
    auth: "none",
    summary: "Public — infrastructure announcements for equipment.",
    responses: [{ status: 200, desc: "Announcements", example: { status: "success", data: [] } }],
  },
  {
    name: "Get Availability",
    method: "GET",
    path: "/api/equipment/{id}/availability",
    auth: "none",
    summary: "Public — availability slots for a given date (YYYY-MM-DD).",
    params: [{ name: "id", type: "integer", desc: "Equipment ID" }],
    query: [{ name: "date", example: "2026-09-25", required: true }],
    responses: [
      {
        status: 200,
        desc: "Availability",
        example: {
          status: "success",
          data: {
            date: "2026-09-25",
            operatingHours: { open: "08:00", close: "12:00", duration: 30 },
            slots: [
              { start: "08:00", end: "08:30", booked: false },
              { start: "08:30", end: "09:00", booked: true },
              { start: "09:00", end: "09:30", booked: false },
            ],
          },
        },
      },
    ],
  },
]);

group("Equipment Bookings — Patient", [
  {
    name: "Book Equipment",
    method: "POST",
    path: "/api/equipment/book",
    auth: "patient",
    summary: "Create a confirmed equipment booking. Fee is derived server-side (equipment price + hospital service fee); a matching Telebirr payment must exist.",
    body: {
      mode: "json",
      value: {
        equipmentId: 21,
        dateTime: "2026-09-25T08:00:00.000Z",
        notes: "Knee CT scan",
        fee: 3550,
      },
    },
    responses: [
      {
        status: 201,
        desc: "Booking created",
        example: {
          status: "success",
          data: {
            id: 92,
            confirmationCode: "BM-4C91F2",
            patientId: 41,
            equipmentId: 21,
            hospitalId: 3,
            dateTime: "2026-09-25T08:00:00.000Z",
            fee: 3550,
            notes: "Knee CT scan",
            status: "confirmed",
            equipment: { id: 21, name: "Siemens CT Scanner", category: "CT_SCAN" },
            hospital: { id: 3, name: "Kirkos General Hospital" },
          },
        },
      },
      {
        status: 400,
        desc: "Slot taken or payment missing",
        example: {
          status: "fail",
          message: "Payment of 3550 ETB is required before booking. Please complete the Telebirr payment first.",
        },
      },
    ],
  },
  {
    name: "Get My Bookings",
    method: "GET",
    path: "/api/equipment/bookings",
    auth: "patient",
    summary: "Bookings for the authenticated patient.",
    query: [
      { name: "status", example: "confirmed" },
      { name: "date", example: "2026-09-25" },
      { name: "from", example: "2026-09-01T00:00:00.000Z" },
      { name: "to", example: "2026-09-30T00:00:00.000Z" },
    ],
    responses: [{ status: 200, desc: "Bookings", example: { status: "success", data: [{ id: 92, status: "confirmed" }] } }],
  },
  {
    name: "Cancel Booking",
    method: "PATCH",
    path: "/api/equipment/bookings/{id}/cancel",
    auth: "patient",
    summary: "Cancel a booking.",
    params: [{ name: "id", type: "integer", desc: "Booking ID" }],
    responses: [{ status: 200, desc: "Cancelled", example: { status: "success", data: { id: 92, status: "cancelled" } } }],
  },
  {
    name: "Reschedule Booking",
    method: "PATCH",
    path: "/api/equipment/bookings/{id}/reschedule",
    auth: "patient",
    summary: "Reschedule a booking.",
    params: [{ name: "id", type: "integer", desc: "Booking ID" }],
    body: { mode: "json", value: { dateTime: "2026-09-26T08:00:00.000Z" } },
    responses: [{ status: 200, desc: "Rescheduled", example: { status: "success", data: { id: 92, dateTime: "2026-09-26T08:00:00.000Z" } } }],
  },
]);

group("Payments", [
  {
    name: "Initialize Payment",
    method: "POST",
    path: "/api/payments/initialize",
    auth: "patient",
    summary: "Start a Chapa checkout for an appointment fee. Returns the hosted checkout URL and txRef for verification.",
    body: { mode: "json", value: { doctorId: 12, amount: 500, returnUrl: "https://bmbooking.app/patient/appointments" } },
    responses: [
      {
        status: 200,
        desc: "Checkout URL",
        example: {
          status: "success",
          data: {
            checkoutUrl: "https://checkout.chapa.co/d/...",
            txRef: "TX17300000004212",
          },
        },
      },
    ],
  },
  {
    name: "Verify Payment",
    method: "GET",
    path: "/api/payments/verify/{txRef}",
    auth: "none",
    summary: "Check whether a payment succeeded (Chapa or Telebirr).",
    params: [{ name: "txRef", type: "string", desc: "Transaction reference" }],
    responses: [
      {
        status: 200,
        desc: "Paid",
        example: { status: "success", data: { paid: true, provider: "chapa", details: { status: "success" } } },
      },
      {
        status: 200,
        desc: "Not paid",
        example: { status: "fail", data: { paid: false, message: "Payment not completed" } },
      },
    ],
  },
  {
    name: "Success Redirect (HTML)",
    method: "GET",
    path: "/api/payments/success-redirect",
    auth: "none",
    summary: "Hosted 'payment successful' landing page. Supports ?from=tg for the Telegram Mini App flow.",
    query: [{ name: "from", example: "tg" }],
    responses: [{ status: 200, desc: "HTML page", example: "<html>...</html>", html: true }],
  },
  {
    name: "Chapa Webhook",
    method: "POST",
    path: "/api/payments/webhook",
    auth: "none",
    summary: "Callback invoked by Chapa after payment.",
    responses: [{ status: 200, desc: "OK", example: "OK", plain: true }],
  },
  {
    name: "Telebirr Notify",
    method: "POST",
    path: "/api/payments/telebirr-notify",
    auth: "none",
    summary: "Webhook from telebirr-h5-integration (port 8080) when a TX- order is paid.",
    body: { mode: "json", value: { orderId: "TX1730000000", status: "paid", amount: 500, transactionId: "TEB123456" } },
    responses: [{ status: 200, desc: "Recorded", example: { status: "success" } }],
  },
  {
    name: "Verify Telebirr Payment",
    method: "POST",
    path: "/api/payments/verify-telebirr",
    auth: "patient",
    summary: "Match a Telebirr ORD order by payment amount (order id stays on the checkout page).",
    body: { mode: "json", value: { amount: 500 } },
    responses: [
      {
        status: 200,
        desc: "Matched",
        example: { status: "success", data: { paid: true, provider: "telebirr", orderId: "ORD1730000000", details: { status: "paid" } } },
      },
      {
        status: 200,
        desc: "No match",
        example: { status: "fail", data: { paid: false, message: "No matching Telebirr payment found for this amount" } },
      },
    ],
  },
]);

group("Wallet", [
  {
    name: "Get Wallet",
    method: "GET",
    path: "/api/wallet",
    auth: "doctor",
    summary: "Doctor wallet balance with latest 20 transactions.",
    responses: [
      {
        status: 200,
        desc: "Wallet",
        example: {
          status: "success",
          data: {
            id: 4,
            doctorId: 12,
            balance: 12450,
            transactions: [
              { id: 1, walletId: 4, amount: 500, type: "CREDIT", description: "Appointment fee", createdAt: "2026-09-20T10:00:00.000Z" },
            ],
          },
        },
      },
    ],
  },
  {
    name: "Request Withdrawal",
    method: "POST",
    path: "/api/wallet/withdraw",
    auth: "doctor",
    summary: "Request a bank withdrawal. Requires a saved payment method.",
    body: {
      mode: "json",
      value: { amount: 3000, bankName: "Awash Bank", accountNumber: "0134509887652", accountName: "Abel Tesfaye" },
    },
    responses: [
      {
        status: 201,
        desc: "Withdrawal requested",
        example: {
          status: "success",
          data: { id: 7, walletId: 4, amount: 3000, status: "pending", createdAt: "2026-09-21T10:10:00.000Z" },
        },
      },
      {
        status: 400,
        desc: "Insufficient balance",
        example: { status: "fail", message: "Insufficient balance" },
      },
    ],
  },
]);

group("Payment Methods", [
  {
    name: "List Payment Methods",
    method: "GET",
    path: "/api/payment-methods",
    auth: "doctor",
    summary: "Doctor's saved bank accounts.",
    responses: [
      {
        status: 200,
        desc: "Methods",
        example: {
          status: "success",
          data: [
            { id: 3, bankName: "Awash Bank", accountNumber: "0134509887652", accountName: "Abel Tesfaye", isPrimary: true },
          ],
        },
      },
    ],
  },
  {
    name: "Add Payment Method",
    method: "POST",
    path: "/api/payment-methods",
    auth: "doctor",
    summary: "Add a bank account.",
    body: { mode: "json", value: { bankName: "CBE", accountNumber: "1000012345678", accountName: "Abel Tesfaye" } },
    responses: [{ status: 201, desc: "Added", example: { status: "success", data: { id: 4, bankName: "CBE", isPrimary: false } } }],
  },
  {
    name: "Delete Payment Method",
    method: "DELETE",
    path: "/api/payment-methods/{id}",
    auth: "doctor",
    summary: "Remove a bank account.",
    params: [{ name: "id", type: "integer", desc: "Method ID" }],
    responses: [{ status: 200, desc: "Deleted", example: { status: "success", message: "Payment method deleted" } }],
  },
  {
    name: "Set Primary Payment Method",
    method: "PATCH",
    path: "/api/payment-methods/{id}/primary",
    auth: "doctor",
    summary: "Mark a bank account as the primary withdrawal destination.",
    params: [{ name: "id", type: "integer", desc: "Method ID" }],
    responses: [{ status: 200, desc: "Primary set", example: { status: "success", data: { id: 4, isPrimary: true } } }],
  },
]);

group("Reviews", [
  {
    name: "Get Doctor Reviews",
    method: "GET",
    path: "/api/reviews/doctor/{id}",
    auth: "none",
    summary: "Public — reviews for a doctor.",
    params: [{ name: "id", type: "integer", desc: "Doctor ID" }],
    responses: [
      {
        status: 200,
        desc: "Reviews",
        example: {
          status: "success",
          data: [
            {
              id: 17,
              patientId: 41,
              doctorId: 12,
              hospitalId: null,
              appointmentId: 1304,
              rating: 5,
              comment: "Very professional and kind.",
              createdAt: "2026-09-20T12:00:00.000Z",
              patient: { id: 41, patientProfile: { fullName: "Sara Alemu" } },
            },
          ],
        },
      },
    ],
  },
  {
    name: "Get Hospital Reviews",
    method: "GET",
    path: "/api/reviews/hospital/{id}",
    auth: "none",
    summary: "Public — reviews for a hospital.",
    params: [{ name: "id", type: "integer", desc: "Hospital ID" }],
    responses: [{ status: 200, desc: "Reviews", example: { status: "success", data: [] } }],
  },
  {
    name: "Add Review",
    method: "POST",
    path: "/api/reviews",
    auth: "patient",
    summary: "Rate (1–5) a doctor or hospital after a completed appointment. Upserts the review.",
    body: {
      mode: "json",
      value: { doctorId: 12, rating: 5, comment: "Very professional and kind.", appointmentId: 1304 },
    },
    responses: [
      {
        status: 201,
        desc: "Created",
        example: { status: "success", data: { id: 18, doctorId: 12, rating: 5, comment: "Very professional and kind." } },
      },
      {
        status: 403,
        desc: "Not eligible",
        example: { status: "fail", message: "You can only review a completed appointment." },
      },
    ],
  },
]);

group("Hospitals", [
  {
    name: "List Hospitals",
    method: "GET",
    path: "/api/hospitals",
    auth: "none",
    summary: "Public — approved hospitals with services, ratings and doctor counts.",
    responses: [
      {
        status: 200,
        desc: "Hospitals",
        example: {
          status: "success",
          data: [
            {
              id: 3,
              name: "Kirkos General Hospital",
              address: "Kirkos, Addis Ababa",
              image: "https://res.cloudinary.com/xxx/.../hospitals/kirkos.jpg",
              description: "Multi-specialty general hospital.",
              phone: "+251116183000",
              latitude: 9.0108,
              longitude: 38.7612,
              cardPrice: 200,
              serviceFee: { amount: 50 },
              services: ["Cardiology", "Radiology", "Emergency"],
              doctorCount: 14,
              rating: 4.6,
              totalReviews: 31,
            },
          ],
        },
      },
    ],
  },
  {
    name: "Search Hospitals & Doctors",
    method: "GET",
    path: "/api/hospitals/search",
    auth: "none",
    summary: "Public — combined search across hospitals and doctors with optional radius filtering.",
    query: [
      { name: "q", example: "cardiology" },
      { name: "service", example: "radiology" },
      { name: "type", example: "hospital|doctor" },
      { name: "location", example: "Bole" },
      { name: "availability", example: "true" },
      { name: "lat", example: "9.03" },
      { name: "lng", example: "38.74" },
      { name: "radius", example: "20", desc: "km" },
    ],
    responses: [
      {
        status: 200,
        desc: "Results",
        example: { status: "success", data: { doctors: [], hospitals: [] } },
      },
    ],
  },
  {
    name: "Get Hospital Detail",
    method: "GET",
    path: "/api/hospitals/{id}",
    auth: "none",
    summary: "Public — hospital profile with approved doctors and reviews.",
    params: [{ name: "id", type: "integer", desc: "Hospital ID" }],
    responses: [
      {
        status: 200,
        desc: "Hospital detail",
        example: {
          status: "success",
          data: {
            id: 3,
            name: "Kirkos General Hospital",
            address: "Kirkos, Addis Ababa",
            email: "info@kirkoshospital.com",
            cardPrice: 200,
            rating: 4.6,
            doctors: [{ id: 12, fullName: "Dr. Abel Tesfaye", specialization: "Cardiology", rating: 4.8 }],
            reviews: [{ id: 5, rating: 5, comment: "Great service", createdAt: "2026-09-01T08:00:00.000Z", patientName: "Sara Alemu" }],
          },
        },
      },
    ],
  },
]);

group("Notifications", [
  {
    name: "Get Notifications",
    method: "GET",
    path: "/api/notifications",
    auth: "patient",
    summary: "Paginated notifications for the current user.",
    query: [
      { name: "page", example: "1" },
      { name: "limit", example: "50" },
    ],
    responses: [
      {
        status: 200,
        desc: "Notifications",
        example: {
          status: "success",
          data: {
            notifications: [
              {
                id: 500,
                userId: 41,
                type: "APPOINTMENT_CONFIRMED",
                title: "Appointment confirmed",
                message: "Your appointment (BM-8FD2A1) with Dr. Abel Tesfaye is confirmed.",
                read: false,
                createdAt: "2026-09-20T06:30:00.000Z",
              },
            ],
            unreadCount: 3,
          },
        },
      },
    ],
  },
  {
    name: "Get Unread Count",
    method: "GET",
    path: "/api/notifications/unread-count",
    auth: "patient",
    summary: "Unread badge count.",
    responses: [{ status: 200, desc: "Count", example: { status: "success", data: { unreadCount: 3 } } }],
  },
  {
    name: "Mark All As Read",
    method: "PATCH",
    path: "/api/notifications/read-all",
    auth: "patient",
    summary: "Mark every notification as read.",
    responses: [{ status: 200, desc: "Done", example: { status: "success", message: "5 notifications marked as read" } }],
  },
  {
    name: "Mark Notification As Read",
    method: "PATCH",
    path: "/api/notifications/{id}/read",
    auth: "patient",
    summary: "Mark a single notification as read.",
    params: [{ name: "id", type: "integer", desc: "Notification ID" }],
    responses: [{ status: 200, desc: "Done", example: { status: "success", message: "Notification marked as read" } }],
  },
  {
    name: "Delete Notification",
    method: "DELETE",
    path: "/api/notifications/{id}",
    auth: "patient",
    summary: "Delete a notification.",
    params: [{ name: "id", type: "integer", desc: "Notification ID" }],
    responses: [{ status: 200, desc: "Deleted", example: { status: "success", message: "Notification deleted" } }],
  },
]);

group("Announcements", [
  {
    name: "Get My Announcements",
    method: "GET",
    path: "/api/announcements",
    auth: "patient",
    summary: "Relevant announcements for the authenticated user.",
    responses: [
      {
        status: 200,
        desc: "Announcements",
        example: {
          status: "success",
          data: [
            {
              id: 9,
              title: "Maintenance notice",
              message: "The MRI unit will be offline on Sunday.",
              category: "maintenance",
              published: true,
              createdAt: "2026-09-18T09:00:00.000Z",
            },
          ],
        },
      },
    ],
  },
]);

group("Hospital Applications", [
  {
    name: "Submit Hospital Application",
    method: "POST",
    path: "/api/hospital-applications",
    auth: "none",
    summary: "Public — submit a hospital partnership application.",
    body: {
      mode: "json",
      value: {
        hospitalName: "Selam Clinic",
        contactPerson: "Dr. Hana Girma",
        contactInfo: "+251911000111 / hana@selamclinic.com",
      },
    },
    responses: [
      {
        status: 201,
        desc: "Application submitted",
        example: {
          status: "success",
          data: { id: 5, hospitalName: "Selam Clinic", status: "PENDING", createdAt: "2026-09-21T09:00:00.000Z" },
        },
      },
    ],
  },
]);

group("Telegram Mini App", [
  {
    name: "Verify Telegram User",
    method: "POST",
    path: "/api/telegram/verify",
    auth: "none",
    summary: "Verify a Telegram Mini App initData payload and return the authenticated user.",
    body: {
      mode: "json",
      value: { initData: "query_id=AAH... &user=%7B%22id%22%3A12345%7D&auth_date=...&hash=..." },
    },
    responses: [
      {
        status: 200,
        desc: "Verified",
        example: { status: "success", data: { valid: true, user: { id: 42, phone: "+251911223344", role: "patient" } } },
      },
    ],
  },
]);

group("Admin", [
  {
    name: "Admin Login",
    method: "POST",
    path: "/api/admin/login",
    auth: "none",
    summary: "Login for the admin dashboard.",
    body: { mode: "json", value: { email: "admin@bm-booking.com", password: "admin123" } },
    responses: [
      {
        status: 200,
        desc: "Login success",
        example: {
          status: "success",
          data: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", user: { id: 1, email: "admin@bm-booking.com", role: "admin" } },
        },
      },
      { status: 401, desc: "Invalid credentials", example: { status: "fail", message: "Invalid email or password" } },
    ],
  },
  {
    name: "Create Admin",
    method: "POST",
    path: "/api/admin/create",
    auth: "admin",
    summary: "Create another administrator.",
    body: { mode: "json", value: { email: "ops@bm-booking.com", password: "Ops@2026" } },
    responses: [{ status: 201, desc: "Created", example: { status: "success", data: { id: 2, email: "ops@bm-booking.com" } } }],
  },
  {
    name: "List Doctors",
    method: "GET",
    path: "/api/admin/doctors",
    auth: "admin",
    summary: "All doctors with user + reviews.",
    responses: [{ status: 200, desc: "Doctors", example: { status: "success", data: [] } }],
  },
  {
    name: "List Pending Doctors",
    method: "GET",
    path: "/api/admin/doctors/pending",
    auth: "admin",
    summary: "Doctors awaiting review.",
    responses: [{ status: 200, desc: "Pending", example: { status: "success", data: [] } }],
  },
  {
    name: "Get Doctor Detail",
    method: "GET",
    path: "/api/admin/doctors/{id}",
    auth: "admin",
    summary: "Doctor detail.",
    params: [{ name: "id", type: "integer", desc: "Doctor ID" }],
    responses: [{ status: 200, desc: "Doctor", example: { status: "success", data: { id: 12 } } }],
  },
  {
    name: "Create Doctor",
    method: "POST",
    path: "/api/admin/doctors",
    auth: "admin",
    summary: "Create a doctor (multipart, profilePicture file).",
    body: {
      mode: "multipart",
      fields: [
        ["fullName", "Dr. Betty Girma"],
        ["phone", "+251922334455"],
        ["specialization", "Pediatrics"],
        ["licenseNumber", "LC-778899"],
        ["experienceYears", "7"],
        ["profilePicture", "(file) photo.jpg"],
      ],
    },
    responses: [{ status: 201, desc: "Created", example: { status: "success", data: { id: 13 } } }],
  },
  {
    name: "Review Doctor",
    method: "POST",
    path: "/api/admin/doctors/review",
    auth: "admin",
    summary: "Approve or reject a doctor's registration.",
    body: { mode: "json", value: { doctorId: 12, status: "Approved", rejectionReason: null } },
    responses: [{ status: 200, desc: "Reviewed", example: { status: "success", data: { id: 12, status: "Approved" } } }],
  },
  {
    name: "Create Doctor Schedule",
    method: "POST",
    path: "/api/admin/doctors/schedules",
    auth: "admin",
    summary: "Create a schedule for any doctor.",
    body: {
      mode: "json",
      value: {
        doctorId: 12,
        date: "2026-09-25",
        startTime: "2026-09-25T08:00:00.000Z",
        endTime: "2026-09-25T12:00:00.000Z",
        slotDuration: 30,
      },
    },
    responses: [{ status: 201, desc: "Created", example: { status: "success", data: { id: 302 } } }],
  },
  {
    name: "Get Doctor Schedules",
    method: "GET",
    path: "/api/admin/doctors/{id}/schedules",
    auth: "admin",
    summary: "Schedules for a doctor.",
    params: [{ name: "id", type: "integer", desc: "Doctor ID" }],
    responses: [{ status: 200, desc: "Schedules", example: { status: "success", data: [] } }],
  },
  {
    name: "Delete Doctor Schedule",
    method: "DELETE",
    path: "/api/admin/doctors/schedules/{id}",
    auth: "admin",
    summary: "Delete a schedule.",
    params: [{ name: "id", type: "integer", desc: "Schedule ID" }],
    responses: [{ status: 200, desc: "Deleted", example: { status: "success", message: "Schedule deleted" } }],
  },
  {
    name: "Update Doctor",
    method: "PUT",
    path: "/api/admin/doctors/{id}",
    auth: "admin",
    summary: "Update doctor profile (multipart).",
    params: [{ name: "id", type: "integer", desc: "Doctor ID" }],
    responses: [{ status: 200, desc: "Updated", example: { status: "success", data: { id: 12 } } }],
  },
  {
    name: "Delete Doctor",
    method: "DELETE",
    path: "/api/admin/doctors/{id}",
    auth: "admin",
    summary: "Delete a doctor.",
    params: [{ name: "id", type: "integer", desc: "Doctor ID" }],
    responses: [{ status: 200, desc: "Deleted", example: { status: "success", message: "Doctor deleted" } }],
  },
  {
    name: "Assign Doctor to Hospital",
    method: "PUT",
    path: "/api/admin/doctors/{id}/assign-hospital",
    auth: "admin",
    summary: "Link a doctor to a hospital.",
    params: [{ name: "id", type: "integer", desc: "Doctor ID" }],
    body: { mode: "json", value: { hospitalId: 3 } },
    responses: [{ status: 200, desc: "Assigned", example: { status: "success", data: { id: 12, hospitalId: 3 } } }],
  },
  {
    name: "List Hospital Doctors",
    method: "GET",
    path: "/api/admin/hospitals/{id}/doctors",
    auth: "admin",
    summary: "Doctors belonging to a hospital.",
    params: [{ name: "id", type: "integer", desc: "Hospital ID" }],
    responses: [{ status: 200, desc: "Doctors", example: { status: "success", data: [] } }],
  },
  {
    name: "Update Doctor Fee",
    method: "PUT",
    path: "/api/admin/doctors/{id}/fee",
    auth: "admin",
    summary: "Set the doctor's appointment fee.",
    params: [{ name: "id", type: "integer", desc: "Doctor ID" }],
    body: { mode: "json", value: { fee: 600 } },
    responses: [{ status: 200, desc: "Updated", example: { status: "success", data: { id: 12, fee: 600 } } }],
  },
  {
    name: "List Patients",
    method: "GET",
    path: "/api/admin/patients",
    auth: "admin",
    summary: "All patients.",
    responses: [{ status: 200, desc: "Patients", example: { status: "success", data: [] } }],
  },
  {
    name: "Get Patient History",
    method: "GET",
    path: "/api/admin/patients/{id}/history",
    auth: "admin",
    summary: "Appointment + equipment booking history for a patient.",
    params: [{ name: "id", type: "integer", desc: "Patient (user) ID" }],
    responses: [{ status: 200, desc: "History", example: { status: "success", data: { patient: {}, appointments: [], equipmentBookings: [] } } }],
  },
  {
    name: "Get System Stats Summary",
    method: "GET",
    path: "/api/admin/stats/summary",
    auth: "admin",
    summary: "System-wide totals.",
    responses: [
      {
        status: 200,
        desc: "Summary",
        example: {
          status: "success",
          data: { total: 842, byStatus: { accepted: 500, completed: 300, cancelled: 42 }, todayAppts: 15, totalRevenue: 285000 },
        },
      },
    ],
  },
  {
    name: "Get Patient Growth",
    method: "GET",
    path: "/api/admin/stats/patient-growth",
    auth: "admin",
    summary: "Monthly patient growth series.",
    responses: [{ status: 200, desc: "Growth", example: { status: "success", data: [] } }],
  },
  {
    name: "Get Active Patients",
    method: "GET",
    path: "/api/admin/stats/active-patients",
    auth: "admin",
    summary: "Active patient counts.",
    responses: [{ status: 200, desc: "Active", example: { status: "success", data: { activeThisMonth: 210, activeThisWeek: 64 } } }],
  },
  {
    name: "Get Appointment Stats",
    method: "GET",
    path: "/api/admin/stats/appointments",
    auth: "admin",
    summary: "Appointment statistics.",
    responses: [{ status: 200, desc: "Stats", example: { status: "success", data: {} } }],
  },
  {
    name: "Get Staff Performance",
    method: "GET",
    path: "/api/admin/stats/staff-performance",
    auth: "admin",
    summary: "Receptionist performance metrics.",
    responses: [{ status: 200, desc: "Performance", example: { status: "success", data: [] } }],
  },
  {
    name: "Get Equipment Utilization",
    method: "GET",
    path: "/api/admin/stats/equipment-utilization",
    auth: "admin",
    summary: "Equipment utilization rates.",
    responses: [{ status: 200, desc: "Utilization", example: { status: "success", data: [] } }],
  },
  {
    name: "Get Analytics",
    method: "GET",
    path: "/api/admin/analytics",
    auth: "admin",
    summary: "Combined analytics.",
    responses: [{ status: 200, desc: "Analytics", example: { status: "success", data: {} } }],
  },
  {
    name: "List Hospitals",
    method: "GET",
    path: "/api/admin/hospitals",
    auth: "admin",
    summary: "All hospitals.",
    responses: [{ status: 200, desc: "Hospitals", example: { status: "success", data: [] } }],
  },
  {
    name: "Create Hospital",
    method: "POST",
    path: "/api/admin/hospitals",
    auth: "admin",
    summary: "Create a hospital (multipart, image file).",
    body: {
      mode: "multipart",
      fields: [
        ["name", "Kirkos General Hospital"],
        ["cardPrice", "200"],
        ["address", "Kirkos, Addis Ababa"],
        ["phone", "+251116183000"],
        ["email", "info@kirkoshospital.com"],
        ["latitude", "9.0108"],
        ["longitude", "38.7612"],
        ["image", "(file) kirkos.jpg"],
      ],
    },
    responses: [{ status: 201, desc: "Created", example: { status: "success", data: { id: 3 } } }],
  },
  {
    name: "Update Hospital",
    method: "PUT",
    path: "/api/admin/hospitals/{id}",
    auth: "admin",
    summary: "Update a hospital (multipart).",
    params: [{ name: "id", type: "integer", desc: "Hospital ID" }],
    responses: [{ status: 200, desc: "Updated", example: { status: "success", data: { id: 3 } } }],
  },
  {
    name: "Delete Hospital",
    method: "DELETE",
    path: "/api/admin/hospitals/{id}",
    auth: "admin",
    summary: "Delete a hospital.",
    params: [{ name: "id", type: "integer", desc: "Hospital ID" }],
    responses: [{ status: 200, desc: "Deleted", example: { status: "success", message: "Hospital deleted" } }],
  },
  {
    name: "Set Hospital Service Fee",
    method: "PUT",
    path: "/api/admin/hospitals/{id}/service-fee",
    auth: "admin",
    summary: "Set the platform service fee for a hospital.",
    params: [{ name: "id", type: "integer", desc: "Hospital ID" }],
    body: { mode: "json", value: { amount: 50 } },
    responses: [{ status: 200, desc: "Set", example: { status: "success", data: { hospitalId: 3, amount: 50 } } }],
  },
  {
    name: "List Receptionists",
    method: "GET",
    path: "/api/admin/receptionists",
    auth: "admin",
    summary: "All receptionist staff.",
    responses: [{ status: 200, desc: "Receptionists", example: { status: "success", data: [] } }],
  },
  {
    name: "Create Receptionist",
    method: "POST",
    path: "/api/admin/receptionists",
    auth: "admin",
    summary: "Create a receptionist account.",
    body: {
      mode: "json",
      value: { username: "r_kirkos", password: "Reception@2026", hospitalId: 3, fullName: "Marta Bekele", phone: "+251912233445" },
    },
    responses: [{ status: 201, desc: "Created", example: { status: "success", data: { id: 22 } } }],
  },
  {
    name: "Update Receptionist",
    method: "PUT",
    path: "/api/admin/receptionists/{id}",
    auth: "admin",
    summary: "Update receptionist profile/permissions.",
    params: [{ name: "id", type: "integer", desc: "Receptionist ID" }],
    responses: [{ status: 200, desc: "Updated", example: { status: "success", data: { id: 22 } } }],
  },
  {
    name: "Delete Receptionist",
    method: "DELETE",
    path: "/api/admin/receptionists/{id}",
    auth: "admin",
    summary: "Delete a receptionist.",
    params: [{ name: "id", type: "integer", desc: "Receptionist ID" }],
    responses: [{ status: 200, desc: "Deleted", example: { status: "success", message: "Receptionist deleted" } }],
  },
  {
    name: "List Withdrawal Requests",
    method: "GET",
    path: "/api/admin/withdrawals",
    auth: "admin",
    summary: "Pending doctor withdrawals.",
    responses: [{ status: 200, desc: "Withdrawals", example: { status: "success", data: [] } }],
  },
  {
    name: "Complete Withdrawal",
    method: "POST",
    path: "/api/admin/withdrawals/{id}/complete",
    auth: "admin",
    summary: "Mark a withdrawal complete and upload the bank receipt.",
    params: [{ name: "id", type: "integer", desc: "Withdrawal ID" }],
    body: { mode: "multipart", fields: [["receipt", "(file) receipt.jpg"]] },
    responses: [{ status: 200, desc: "Completed", example: { status: "success", data: { id: 7, status: "completed" } } }],
  },
  {
    name: "Add Equipment",
    method: "POST",
    path: "/api/admin/equipment",
    auth: "admin",
    summary: "Add medical equipment (multipart). operatingHours and price are JSON-encoded form fields.",
    body: {
      mode: "multipart",
      fields: [
        ["name", "Siemens CT Scanner"],
        ["category", "CT_SCAN"],
        ["hospitalId", "3"],
        ["duration", "30"],
        ["price", '{ "amount": 3500 }'],
        ['operatingHours', '{"monday":{"start":"08:00","end":"17:00","duration":30,"enabled":true}}'],
        ["photo", "(file) ct.jpg"],
      ],
    },
    responses: [{ status: 201, desc: "Added", example: { status: "success", data: { id: 21 } } }],
  },
  {
    name: "Bulk Add Equipment",
    method: "POST",
    path: "/api/admin/equipment/bulk",
    auth: "admin",
    summary: "Add multiple equipment items at once.",
    body: {
      mode: "json",
      value: {
        items: [
          { name: "Ventilator A", category: "VENTILATOR", hospitalId: 3, duration: 60 },
          { name: "Ventilator B", category: "VENTILATOR", hospitalId: 3, duration: 60 },
        ],
      },
    },
    responses: [{ status: 201, desc: "Added", example: { status: "success", data: { count: 2 } } }],
  },
  {
    name: "Update Equipment",
    method: "PUT",
    path: "/api/admin/equipment/{id}",
    auth: "admin",
    summary: "Update equipment (multipart).",
    params: [{ name: "id", type: "integer", desc: "Equipment ID" }],
    responses: [{ status: 200, desc: "Updated", example: { status: "success", data: { id: 21 } } }],
  },
  {
    name: "Delete Equipment",
    method: "DELETE",
    path: "/api/admin/equipment/{id}",
    auth: "admin",
    summary: "Delete equipment.",
    params: [{ name: "id", type: "integer", desc: "Equipment ID" }],
    responses: [{ status: 200, desc: "Deleted", example: { status: "success", message: "Equipment deleted" } }],
  },
  {
    name: "Create Equipment Announcement",
    method: "POST",
    path: "/api/admin/equipment/announce",
    auth: "admin",
    summary: "Broadcast a maintenance/availability announcement.",
    body: { mode: "json", value: { title: "Maintenance notice", message: "MRI down Sunday", category: "maintenance", hospitalId: 3 } },
    responses: [{ status: 201, desc: "Created", example: { status: "success", data: { id: 9 } } }],
  },
  {
    name: "List All Equipment Bookings",
    method: "GET",
    path: "/api/admin/equipment-bookings",
    auth: "admin",
    summary: "Equipment bookings across all hospitals.",
    responses: [{ status: 200, desc: "Bookings", example: { status: "success", data: [] } }],
  },
  {
    name: "List Hospital Applications",
    method: "GET",
    path: "/api/admin/hospital-applications",
    auth: "admin",
    summary: "Partnership applications.",
    query: [{ name: "status", example: "PENDING" }],
    responses: [{ status: 200, desc: "Applications", example: { status: "success", data: [] } }],
  },
  {
    name: "Update Hospital Application",
    method: "PATCH",
    path: "/api/admin/hospital-applications/{id}",
    auth: "admin",
    summary: "Mark an application CONTACTED and add notes.",
    params: [{ name: "id", type: "integer", desc: "Application ID" }],
    body: { mode: "json", value: { status: "CONTACTED", notes: "Called manager on 2026-09-21" } },
    responses: [{ status: 200, desc: "Updated", example: { status: "success", data: { id: 5, status: "CONTACTED" } } }],
  },
  {
    name: "List Hospital Registrations",
    method: "GET",
    path: "/api/admin/hospital-registrations",
    auth: "admin",
    summary: "Hospital portal registration requests.",
    responses: [{ status: 200, desc: "Registrations", example: { status: "success", data: [] } }],
  },
  {
    name: "Update Hospital Registration",
    method: "PATCH",
    path: "/api/admin/hospital-registrations/{id}",
    auth: "admin",
    summary: "Approve/reject a hospital registration.",
    params: [{ name: "id", type: "integer", desc: "Registration ID" }],
    responses: [{ status: 200, desc: "Updated", example: { status: "success", data: { id: 3, status: "APPROVED" } } }],
  },
  {
    name: "Create Announcement",
    method: "POST",
    path: "/api/admin/announcements",
    auth: "admin",
    summary: "Create an announcement.",
    body: { mode: "json", value: { title: "New feature", message: "Equipment booking now live.", category: "general" } },
    responses: [{ status: 201, desc: "Created", example: { status: "success", data: { id: 10 } } }],
  },
  {
    name: "Update Announcement",
    method: "PUT",
    path: "/api/admin/announcements/{id}",
    auth: "admin",
    summary: "Update an announcement.",
    params: [{ name: "id", type: "integer", desc: "Announcement ID" }],
    responses: [{ status: 200, desc: "Updated", example: { status: "success", data: { id: 10 } } }],
  },
  {
    name: "Delete Announcement",
    method: "DELETE",
    path: "/api/admin/announcements/{id}",
    auth: "admin",
    summary: "Delete an announcement.",
    params: [{ name: "id", type: "integer", desc: "Announcement ID" }],
    responses: [{ status: 200, desc: "Deleted", example: { status: "success", data: { id: 10 } } }],
  },
  {
    name: "Publish Announcement",
    method: "PATCH",
    path: "/api/admin/announcements/{id}/publish",
    auth: "admin",
    summary: "Publish an announcement.",
    params: [{ name: "id", type: "integer", desc: "Announcement ID" }],
    responses: [{ status: 200, desc: "Published", example: { status: "success", data: { id: 10, published: true } } }],
  },
  {
    name: "Resend Announcement",
    method: "POST",
    path: "/api/admin/announcements/{id}/resend",
    auth: "admin",
    summary: "Re-push an announcement to recipients.",
    params: [{ name: "id", type: "integer", desc: "Announcement ID" }],
    responses: [{ status: 200, desc: "Sent", example: { status: "success", message: "Announcement resent" } }],
  },
]);

group("Hospital Portal", [
  {
    name: "Register Hospital",
    method: "POST",
    path: "/api/hospital/register",
    auth: "none",
    summary: "Public — register a hospital and its admin account. Awaiting admin approval before login works.",
    body: {
      mode: "json",
      value: {
        name: "Kirkos General Hospital",
        address: "Kirkos, Addis Ababa",
        phone: "+251116183000",
        email: "info@kirkoshospital.com",
        adminPhone: "+251911223344",
        password: "Hospital@2026",
        services: ["Cardiology", "Radiology"],
        latitude: 9.0108,
        longitude: 38.7612,
      },
    },
    responses: [
      { status: 201, desc: "Registered", example: { status: "success", data: { hospitalId: 3, status: "PENDING" } } },
      { status: 409, desc: "Already registered", example: { status: "fail", message: "A hospital with this name/phone already exists" } },
    ],
  },
  {
    name: "Get Portal Context (Me)",
    method: "GET",
    path: "/api/hospital/me",
    auth: "hospital",
    summary: "Current portal user + hospital context.",
    responses: [
      {
        status: 200,
        desc: "Context",
        example: {
          status: "success",
          data: {
            user: {
              id: 3,
              role: "hospital",
              hospitalRole: "owner",
              hospitalId: 3,
              permissions: ["*"],
              username: null,
              phone: "+251911223344",
              fullName: null,
            },
            hospital: {
              id: 3,
              name: "Kirkos General Hospital",
              logo: null,
              status: "APPROVED",
            },
          },
        },
      },
    ],
  },
  {
    name: "Get Profile",
    method: "GET",
    path: "/api/hospital/profile",
    auth: "hospital",
    summary: "Full hospital profile (settings.view).",
    responses: [{ status: 200, desc: "Profile", example: { status: "success", data: { id: 3, name: "Kirkos General Hospital" } } }],
  },
  {
    name: "Update Profile",
    method: "PATCH",
    path: "/api/hospital/profile",
    auth: "hospital",
    summary: "Update hospital profile (settings.edit).",
    body: { mode: "json", value: { description: "Renovated 2026.", phone: "+251116183000" } },
    responses: [{ status: 200, desc: "Updated", example: { status: "success", data: { id: 3 } } }],
  },
  {
    name: "Get Stats",
    method: "GET",
    path: "/api/hospital/stats",
    auth: "hospital",
    summary: "Hospital dashboard stats (analytics.view).",
    responses: [
      {
        status: 200,
        desc: "Stats",
        example: { status: "success", data: { doctors: 14, appointmentsThisMonth: 210, revenueThisMonth: 96000, equipmentBookings: 18 } },
      },
    ],
  },
  {
    name: "Get Overview",
    method: "GET",
    path: "/api/hospital/overview",
    auth: "hospital",
    summary: "Overview widgets (analytics.view).",
    responses: [{ status: 200, desc: "Overview", example: { status: "success", data: {} } }],
  },
  {
    name: "List Appointments",
    method: "GET",
    path: "/api/hospital/appointments",
    auth: "hospital",
    summary: "Hospital-wide appointments with filters.",
    query: [
      { name: "status", example: "pending" },
      { name: "from", example: "2026-09-01T00:00:00.000Z" },
      { name: "to", example: "2026-09-30T00:00:00.000Z" },
      { name: "search", example: "BM-8FD2A1" },
      { name: "limit", example: "500" },
    ],
    responses: [{ status: 200, desc: "Appointments", example: { status: "success", data: { appointments: [], total: 0 } } }],
  },
  {
    name: "List Doctors",
    method: "GET",
    path: "/api/hospital/doctors",
    auth: "hospital",
    summary: "Doctors of the hospital.",
    query: [{ name: "includeAll", example: "true" }],
    responses: [{ status: 200, desc: "Doctors", example: { status: "success", data: [] } }],
  },
  {
    name: "Register Doctor",
    method: "POST",
    path: "/api/hospital/doctors/register",
    auth: "hospital",
    summary: "Register a doctor to the hospital (multipart files).",
    body: {
      mode: "multipart",
      fields: [
        ["fullName", "Dr. Betty Girma"],
        ["phone", "+251922334455"],
        ["email", "betty@kirkoshospital.com"],
        ["specialization", "Pediatrics"],
        ["licenseNumber", "LC-778899"],
        ["experienceYears", "7"],
        ["profilePicture", "(file) photo.jpg"],
        ["introVideo", "(file) intro.mp4"],
      ],
    },
    responses: [{ status: 201, desc: "Registered", example: { status: "success", data: { id: 13 } } }],
  },
  {
    name: "Update Doctor Status",
    method: "PATCH",
    path: "/api/hospital/doctors/{id}/status",
    auth: "hospital",
    summary: "Set doctor operational status.",
    params: [{ name: "id", type: "integer", desc: "Doctor ID" }],
    responses: [{ status: 200, desc: "Updated", example: { status: "success", data: { id: 13, isActive: true } } }],
  },
  {
    name: "List Schedules",
    method: "GET",
    path: "/api/hospital/schedules",
    auth: "hospital",
    summary: "All hospital doctor schedules.",
    responses: [{ status: 200, desc: "Schedules", example: { status: "success", data: [] } }],
  },
  {
    name: "Approve Appointment",
    method: "PATCH",
    path: "/api/hospital/appointments/{id}/approve",
    auth: "hospital",
    summary: "Approve an appointment (optionally assign a slot).",
    params: [{ name: "id", type: "integer", desc: "Appointment ID" }],
    body: { mode: "json", value: { slotId: 4101 } },
    responses: [{ status: 200, desc: "Approved", example: { status: "success", data: { id: 1304, status: "accepted" } } }],
  },
  {
    name: "Add Equipment",
    method: "POST",
    path: "/api/hospital/equipment",
    auth: "hospital",
    summary: "Add equipment to the hospital (multipart).",
    body: {
      mode: "multipart",
      fields: [
        ["name", "Siemens CT Scanner"],
        ["category", "CT_SCAN"],
        ["price", "3500"],
        ['operatingHours', '{"monday":{"start":"08:00","end":"17:00","duration":30,"enabled":true}}'],
        ["photo", "(file) ct.jpg"],
      ],
    },
    responses: [{ status: 201, desc: "Added", example: { status: "success", data: { id: 21 } } }],
  },
  {
    name: "List Equipment Bookings",
    method: "GET",
    path: "/api/hospital/equipment-bookings",
    auth: "hospital",
    summary: "Bookings for the hospital's equipment.",
    responses: [{ status: 200, desc: "Bookings", example: { status: "success", data: [] } }],
  },
  {
    name: "Confirm Equipment Booking",
    method: "PATCH",
    path: "/api/hospital/equipment-bookings/{id}/confirm",
    auth: "hospital",
    summary: "Confirm a booking.",
    params: [{ name: "id", type: "integer", desc: "Booking ID" }],
    responses: [{ status: 200, desc: "Confirmed", example: { status: "success", data: { id: 92, status: "confirmed" } } }],
  },
  {
    name: "Create Card Template",
    method: "POST",
    path: "/api/hospital/card-templates",
    auth: "hospital",
    summary: "Define a patient card template.",
    body: { mode: "json", value: { name: "Annual Visit Card", price: 2000, validityDays: 365 } },
    responses: [{ status: 201, desc: "Created", example: { status: "success", data: { id: 3 } } }],
  },
  {
    name: "Issue Patient Card",
    method: "POST",
    path: "/api/hospital/cards",
    auth: "hospital",
    summary: "Issue a card to a patient.",
    body: { mode: "json", value: { patientId: 41, templateId: 3, isPaid: true } },
    responses: [{ status: 201, desc: "Issued", example: { status: "success", data: { id: 88, code: "KGH-2026-0001" } } }],
  },
  {
    name: "List Staff",
    method: "GET",
    path: "/api/hospital/staff",
    auth: "hospital",
    summary: "List receptionist staff (owner only).",
    responses: [{ status: 200, desc: "Staff", example: { status: "success", data: [] } }],
  },
  {
    name: "Create Staff",
    method: "POST",
    path: "/api/hospital/staff",
    auth: "hospital",
    summary: "Create a receptionist (owner only).",
    body: {
      mode: "json",
      value: { username: "r_kirkos", password: "Reception@2026", fullName: "Marta Bekele", phone: "+251912233445", permissions: ["appointments.view", "patients.create"] },
    },
    responses: [{ status: 201, desc: "Created", example: { status: "success", data: { id: 22 } } }],
  },
]);

group("Receptionist (Legacy /api/receptionist)", [
  {
    name: "Get Dashboard Stats",
    method: "GET",
    path: "/api/receptionist/stats/dashboard",
    auth: "receptionist",
    summary: "Receptionist dashboard.",
    responses: [{ status: 200, desc: "Stats", example: { status: "success", data: {} } }],
  },
  {
    name: "Get Hospital",
    method: "GET",
    path: "/api/receptionist/hospital",
    auth: "receptionist",
    summary: "The receptionist's hospital.",
    responses: [{ status: 200, desc: "Hospital", example: { status: "success", data: { id: 3 } } }],
  },
  {
    name: "Update Hospital Card Price",
    method: "PATCH",
    path: "/api/receptionist/hospital/card-price",
    auth: "receptionist",
    summary: "Set hospital card price.",
    body: { mode: "json", value: { cardPrice: 250 } },
    responses: [{ status: 200, desc: "Updated", example: { status: "success", data: { id: 3, cardPrice: 250 } } }],
  },
  {
    name: "Search Patients",
    method: "GET",
    path: "/api/receptionist/patients",
    auth: "receptionist",
    summary: "Search patients by name/phone.",
    responses: [{ status: 200, desc: "Patients", example: { status: "success", data: [] } }],
  },
  {
    name: "Patient Directory",
    method: "GET",
    path: "/api/receptionist/patients/directory",
    auth: "receptionist",
    summary: "Paginated patient directory.",
    responses: [{ status: 200, desc: "Directory", example: { status: "success", data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } } } }],
  },
  {
    name: "Create Patient",
    method: "POST",
    path: "/api/receptionist/patients",
    auth: "receptionist",
    summary: "Register a new patient.",
    body: { mode: "json", value: { phone: "+251911111222", fullName: "Helen Tadesse", gender: "female", dateOfBirth: "1990-07-15" } },
    responses: [{ status: 201, desc: "Created", example: { status: "success", data: { id: 42, phone: "+251911111222" } } }],
  },
  {
    name: "Get Patient History",
    method: "GET",
    path: "/api/receptionist/patients/{id}/history",
    auth: "receptionist",
    summary: "Appointments + equipment bookings for a patient.",
    params: [{ name: "id", type: "integer", desc: "Patient user ID" }],
    responses: [{ status: 200, desc: "History", example: { status: "success", data: { patient: {}, appointments: [], equipmentBookings: [] } } }],
  },
  {
    name: "List Hospital Doctors",
    method: "GET",
    path: "/api/receptionist/doctors",
    auth: "receptionist",
    summary: "Doctors of the hospital.",
    responses: [{ status: 200, desc: "Doctors", example: { status: "success", data: [] } }],
  },
  {
    name: "Register Doctor",
    method: "POST",
    path: "/api/receptionist/doctors/register",
    auth: "receptionist",
    summary: "Register a doctor (multipart).",
    body: {
      mode: "multipart",
      fields: [
        ["fullName", "Dr. Betty Girma"],
        ["phone", "+251922334455"],
        ["specialization", "Pediatrics"],
        ["licenseNumber", "LC-778899"],
        ["profilePicture", "(file) photo.jpg"],
      ],
    },
    responses: [{ status: 201, desc: "Registered", example: { status: "success", data: { id: 13 } } }],
  },
  {
    name: "Review Doctor",
    method: "PATCH",
    path: "/api/receptionist/doctors/{id}/review",
    auth: "receptionist",
    summary: "Approve or reject a registered doctor.",
    params: [{ name: "id", type: "integer", desc: "Doctor ID" }],
    body: { mode: "json", value: { status: "Approved", rejectionReason: null } },
    responses: [{ status: 200, desc: "Reviewed", example: { status: "success", data: { id: 13, status: "Approved" } } }],
  },
  {
    name: "List Equipment",
    method: "GET",
    path: "/api/receptionist/equipment",
    auth: "receptionist",
    summary: "Hospital equipment.",
    responses: [{ status: 200, desc: "Equipment", example: { status: "success", data: [] } }],
  },
  {
    name: "Add Equipment",
    method: "POST",
    path: "/api/receptionist/equipment",
    auth: "receptionist",
    summary: "Add equipment (multipart).",
    body: {
      mode: "multipart",
      fields: [["name", "Ultrasound GE"], ["category", "ULTRASOUND"], ["price", "800"], ["photo", "(file) us.jpg"]],
    },
    responses: [{ status: 201, desc: "Added", example: { status: "success", data: { id: 22 } } }],
  },
  {
    name: "List Schedules",
    method: "GET",
    path: "/api/receptionist/schedules",
    auth: "receptionist",
    summary: "Hospital doctor schedules.",
    responses: [{ status: 200, desc: "Schedules", example: { status: "success", data: [] } }],
  },
  {
    name: "Create Schedule",
    method: "POST",
    path: "/api/receptionist/schedules",
    auth: "receptionist",
    summary: "Create a schedule for a doctor.",
    body: {
      mode: "json",
      value: { doctorId: 12, date: "2026-09-25", startTime: "2026-09-25T08:00:00.000Z", endTime: "2026-09-25T12:00:00.000Z", slotDuration: 30 },
    },
    responses: [{ status: 201, desc: "Created", example: { status: "success", data: { id: 303 } } }],
  },
  {
    name: "List Upcoming Appointments",
    method: "GET",
    path: "/api/receptionist/appointments/upcoming",
    auth: "receptionist",
    summary: "Upcoming appointments.",
    responses: [{ status: 200, desc: "Appointments", example: { status: "success", data: [] } }],
  },
  {
    name: "Approve Appointment",
    method: "PATCH",
    path: "/api/receptionist/appointments/{id}/approve",
    auth: "receptionist",
    summary: "Approve an appointment.",
    params: [{ name: "id", type: "integer", desc: "Appointment ID" }],
    body: { mode: "json", value: { slotId: 4101 } },
    responses: [{ status: 200, desc: "Approved", example: { status: "success", data: { id: 1304 } } }],
  },
  {
    name: "Deny Appointment",
    method: "PATCH",
    path: "/api/receptionist/appointments/{id}/deny",
    auth: "receptionist",
    summary: "Deny an appointment with a reason.",
    params: [{ name: "id", type: "integer", desc: "Appointment ID" }],
    body: { mode: "json", value: { reason: "Doctor unavailable" } },
    responses: [{ status: 200, desc: "Denied", example: { status: "success", data: { id: 1304, status: "declined" } } }],
  },
  {
    name: "Create Equipment Booking",
    method: "POST",
    path: "/api/receptionist/equipment-bookings",
    auth: "receptionist",
    summary: "Book equipment for a patient.",
    body: { mode: "json", value: { patientId: 41, equipmentId: 21, dateTime: "2026-09-25T08:00:00.000Z", fee: 3550, notes: "Knee CT" } },
    responses: [{ status: 201, desc: "Created", example: { status: "success", data: { id: 92, confirmationCode: "BM-4C91F2" } } }],
  },
  {
    name: "List Equipment Bookings",
    method: "GET",
    path: "/api/receptionist/equipment-bookings",
    auth: "receptionist",
    summary: "Hospital equipment bookings.",
    responses: [{ status: 200, desc: "Bookings", example: { status: "success", data: [] } }],
  },
  {
    name: "Create Card Template",
    method: "POST",
    path: "/api/receptionist/card-templates",
    auth: "receptionist",
    summary: "Create a card template.",
    body: { mode: "json", value: { name: "Monthly Card", price: 220, validityDays: 30 } },
    responses: [{ status: 201, desc: "Created", example: { status: "success", data: { id: 4 } } }],
  },
  {
    name: "Issue Card",
    method: "POST",
    path: "/api/receptionist/cards",
    auth: "receptionist",
    summary: "Issue a card to a patient.",
    body: { mode: "json", value: { patientId: 41, templateId: 4, isPaid: true } },
    responses: [{ status: 201, desc: "Issued", example: { status: "success", data: { id: 89 } } }],
  },
  {
    name: "Reorder Appointments",
    method: "PATCH",
    path: "/api/receptionist/appointments/reorder",
    auth: "receptionist",
    summary: "Reorder today's queue for a doctor.",
    body: { mode: "json", value: { doctorId: 12, date: "2026-09-25", orderedSlots: [4101, 4102, null] } },
    responses: [{ status: 200, desc: "Reordered", example: { status: "success", data: { success: true } } }],
  },
]);

group("Legal Pages", [
  {
    name: "Privacy Policy (HTML)",
    method: "GET",
    path: "/api/legal/privacy",
    auth: "none",
    summary: "Rendered privacy policy page.",
    responses: [{ status: 200, desc: "HTML page", example: "<html>...</html>", html: true }],
  },
  {
    name: "Terms of Use (HTML)",
    method: "GET",
    path: "/api/legal/terms",
    auth: "none",
    summary: "Rendered terms page.",
    responses: [{ status: 200, desc: "HTML page", example: "<html>...</html>", html: true }],
  },
]);

// ---------------------------------------------------------------------------
// Writers
// ---------------------------------------------------------------------------

const json = (value) => JSON.stringify(value, null, 2);

function markdown(endpoints) {
  const lines = [];
  let count = 0;
  for (const { name, endpoints: eps } of GROUPS) {
    lines.push(`## ${name}`);
    lines.push("");
    for (const ep of eps) {
      count += 1;
      lines.push(`### ${ep.method} \`${ep.path}\` ${ep.auth && ep.auth !== "none" ? "🔒" : ""}`);
      lines.push("");
      lines.push(`**${ep.name}** — ${ep.summary}`);
      lines.push("");
      lines.push(`- **Auth:** ${AUTH_LABEL[ep.auth] || "None"}`);
      lines.push(
        `- **Body:** ${
          ep.body ? (ep.body.mode === "json" ? "JSON" : ep.body.mode === "formdata" || ep.body.mode === "multipart" ? "multipart/form-data" : "text") : "None"
        }`,
      );
      if (ep.params && ep.params.length) {
        lines.push(`- **Path params:** ${ep.params.map((p) => `\`${p.name}\` (${p.type}) — ${p.desc}`).join("; ")}`);
      }
      if (ep.query && ep.query.length) {
        lines.push(
          `- **Query params:** ${ep.query
            .map((q) => `\`${q.name}\`${q.required ? " *(required)*" : ""}${q.example !== undefined ? ` e.g. \`${q.example}\`` : ""}`)
            .join("; ")}`,
        );
      }
      lines.push("");
      lines.push("**Request**");
      lines.push("");
      const hostAuth =
        ep.auth && ep.auth !== "none"
          ? `Authorization: Bearer {{${ep.auth}Token}}`
          : "";
      const ctype =
        ep.body && (ep.body.mode === "formdata" || ep.body.mode === "multipart")
          ? " " // note below
          : ep.body && ep.body.mode === "json"
          ? "Content-Type: application/json"
          : "";
      lines.push("```http");
      lines.push(`${ep.method} {{baseUrl}}${ep.path}`);
      if (hostAuth) lines.push(hostAuth);
      if (ctype) lines.push(ctype);
      if (ep.body) lines.push("");
      if (ep.body && ep.body.mode === "json") {
        lines.push(json(ep.body.value));
      } else if (ep.body && (ep.body.mode === "formdata" || ep.body.mode === "multipart")) {
        lines.push("# multipart/form-data");
        for (const [k, v] of ep.body.fields) {
          lines.push(`#   ${k}: ${v}`);
        }
      }
      lines.push("```");
      lines.push("");
      if (ep.body && (ep.body.mode === "formdata" || ep.body.mode === "multipart")) {
        lines.push("");
        lines.push("> HTTP body should be `multipart/form-data`. File fields are marked `(file)`.");
        lines.push("");
      }
      lines.push("**Sample responses**");
      lines.push("");
      for (const r of ep.responses) {
        lines.push(`\`${r.status}\` — ${r.desc}`);
        lines.push("");
        lines.push("```json");
        if (r.plain) lines.push(json(r.example));
        else if (r.html) lines.push(r.example.replace(/`/g, "\\`"));
        else lines.push(json(r.example));
        lines.push("```");
        lines.push("");
      }
    }
  }
  return lines.join("\n");
}

function openapi() {
  const tags = []; // mutable refs in paths
  const paths = {};

  const parametersFor = (ep) => {
    const list = [];
    for (const p of ep.params || []) {
      list.push({
        name: p.name,
        in: "path",
        required: true,
        schema: { type: p.type === "integer" ? "integer" : "string" },
        description: p.desc,
      });
    }
    for (const q of ep.query || []) {
      list.push({
        name: q.name,
        in: "query",
        ...(q.required ? { required: true } : {}),
        schema: { type: "string" },
        description: q.desc || (q.example !== undefined ? `Example: ${q.example}` : ""),
      });
    }
    return list.length ? list : undefined;
  };

  const operationId = (ep) => {
    const base = ep.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "");
    return ep.method.toLowerCase() + "_" + base;
  };

  for (const { name, endpoints: eps } of GROUPS) {
    tags.push(name);
    for (const ep of eps) {
      const op = {
        operationId: operationId(ep),
        tags: [name],
        summary: ep.name + (ep.summary ? ` — ${ep.summary}` : ""),
        description: ep.summary,
        parameters: parametersFor(ep),
        responses: {},
      };
      if (ep.auth && ep.auth !== "none") {
        op.security = [{ bearerAuth: [] }];
      }
      for (const r of ep.responses) {
        op.responses[r.status] = {
          description: r.desc,
        };
        if (!r.html && !r.plain) {
          op.responses[r.status].content = {
            "application/json": {
              example: r.example,
            },
          };
        } else if (r.plain) {
          op.responses[r.status].content = {
            "text/plain": { example: String(r.example) },
          };
        } else {
          op.responses[r.status].content = {
            "text/html": { example: String(r.example) },
          };
        }
      }
      const specPath = ep.path.replace(/\{/g, "{").replace(/\}/g, "}");
      if (!paths[specPath]) paths[specPath] = {};
      paths[specPath][ep.method.toLowerCase()] = op;

      // requestBody
      if (ep.body) {
        if (ep.body.mode === "json") {
          op.requestBody = {
            required: true,
            content: {
              "application/json": { example: ep.body.value },
            },
          };
        } else if (ep.body.mode === "multipart" || ep.body.mode === "formdata") {
          const props = {};
          const required = [];
          for (const [k, v] of ep.body.fields) {
            props[k] = { type: v.startsWith("(file)") ? "string" : "string", format: v.startsWith("(file)") ? "binary" : undefined, example: v.startsWith("(file)") ? undefined : v };
            required.push(k);
          }
          op.requestBody = {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: props,
                  required: required.length ? required : undefined,
                },
              },
            },
          };
        }
      }
    }
  }

  return {
    openapi: "3.0.3",
    info: {
      title: "BM Booking API",
      version: "1.0.0",
      description:
        "REST API for BM Booking (weleba.tech) — doctor/patient appointment booking, medical equipment booking, Telebirr & Chapa payments, hospital portal, receptionist tooling and admin analytics. Generated from apps/backend source.",
    },
    servers: [
      { url: BASE, description: "Local dev server" },
      { url: "https://api.weleba.tech", description: "Production server" },
    ],
    tags: tags.map((t) => ({ name: t })),
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Writer entry
// ---------------------------------------------------------------------------

function buildPostmanCollection() {
  const folders = GROUPS.map(({ name, endpoints: eps }) => ({
    name,
    item: eps.map((ep) => {
      const req = {
        method: ep.method,
        header: [{ key: "Content-Type", value: "application/json" }],
        url: {
          raw: "{{baseUrl}}" + ep.path,
          host: ["{{baseUrl}}"],
          path: splitPath(ep.path),
          ...(ep.query && ep.query.length
            ? {
                query: ep.query.map((q) => ({
                  key: q.name,
                  value: q.example !== undefined ? String(q.example) : "",
                  ...(q.required ? { disabled: false } : { disabled: true }),
                })),
              }
            : {}),
        },
      };
      if (ep.auth && ep.auth !== "none") {
        req.auth = {
          type: "bearer",
          bearer: [{ key: "token", value: `{{${ep.auth}Token}}`, type: "string" }],
        };
      }
      if (ep.body) {
        if (ep.body.mode === "json") {
          req.body = {
            mode: "raw",
            raw: json(ep.body.value),
            options: { raw: { language: "json" } },
          };
        } else {
          req.body = {
            mode: "formdata",
            formdata: ep.body.fields.map(([key, val]) => ({
              key,
              value: val.startsWith("(file)") ? "" : val,
              type: val.startsWith("(file)") ? "file" : "text",
              ...(val.startsWith("(file)") ? { src: [] } : {}),
            })),
          };
        }
      }
      return { name: ep.name, request: req, response: [] };
    }),
  }));

  return {
    info: {
      _postman_id: "a1b2c3d4-0000-4000-8000-bmbooking000001",
      name: "BM Booking API (full)",
      description: "Generated from scripts/generate-api-docs.js. Companion to bm-booking-openapi.json.",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: folders,
    variable: ENV.map((e) => ({ key: e.key, value: e.value, type: "string" })),
  };
}

function splitPath(p) {
  return p.replace(/^\//, "").split("/").map((s) => s.replace(/[{}]/g, ""));
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 1. OpenAPI 3.0.3 export (importable into Postman)
  fs.writeFileSync(
    path.join(OUT_DIR, "bm-booking-openapi.json"),
    json(openapi()) + "\n",
    "utf8",
  );
  console.log("✓ wrote bm-booking-openapi.json");

  // 2. Markdown reference
  const mdSections = [];
  mdSections.push(`# BM Booking API — Postman Collection & Reference

Real, import-ready API documentation for **BM Booking** (weleba.tech / possibletechplc.com).
This document is generated from the actual backend source in \`apps/backend/src\` (routes +
controllers), so every request body and response here matches the real API contract.

- **Repo:** \`apps/backend/src/server.js\` mounts every route under \`/api\`.
- **Base URL:** \`{{baseUrl}}\` → \`http://localhost:5000\` (prod: \`https://api.weleba.tech\`)
- **Postman import:** use \`bm-booking-openapi.json\` (same folder) → *Postman → Import → OpenAPI*,
  or import the generated collection \`bm-booking-collection.json\`.
- **Postman environment variables**
  | Variable | Used by |
  |---|---|
  | \`baseUrl\` | every request |
  | \`patientToken\` | Patient-flow requests |
  | \`doctorToken\` | Doctor-flow requests |
  | \`adminToken\` | Admin requests |
  | \`hospitalToken\` | Hospital portal requests |
  | \`receptionistToken\` | Receptionist requests |
  | \`txRef\` | payment verification |

## Authentication

Every protected route expects a JWT in the \`Authorization: Bearer <token>\` header.
Tokens are obtained from OTP verification (\`POST /api/auth/verify-otp\`), the admin login
(\`POST /api/admin/login\`), or the hospital/receptionist login endpoints.

### Roles & tokens
| Role | Login endpoint | Postman variable |
|---|---|---|
| Patient | \`POST /api/auth/verify-otp\` with \`role: patient\` | \`{{patientToken}}\` |
| Doctor | \`POST /api/auth/verify-otp\` with \`role: doctor\` | \`{{doctorToken}}\` |
| Admin | \`POST /api/admin/login\` | \`{{adminToken}}\` |
| Hospital owner/staff | \`POST /api/auth/hospital-portal-login\` | \`{{hospitalToken}}\` |
| Receptionist | \`POST /api/auth/receptionist-login\` | \`{{receptionistToken}}\` |

### Response envelope
All JSON endpoints return:
\`\`\`json
{ "status": "success" | "fail" | "error", "data": ..., "message": "..." }
\`\`\`
- 2xx success → \`status: "success"\` with \`data\` (or \`message\`).
- Expected client error → \`4xx\` with \`status: "fail"\` + \`message\`.
- Server error → \`5xx\` with \`status: "error"\` + \`message\`.

### Factor highlights (from the source)
- **Phone format:** Ethiopian numbers, \`+251[79]XXXXXXXX\` (normalized automatically).
- **OTP:** 6-digit, 5-minute expiry; 5 wrong attempts → account locked 30 minutes; codes are single-use.
- **Payments:** a fee-bearing appointment/equipment booking requires a matched Telebirr payment of the exact
  amount (verified server-side) before it is created.
- **Reviews:** only possible against a \`completed\` appointment that belongs to you.

---

## Endpoint index

| # | Method | Path | Auth |
|---|---|---|---|
${(() => {
  const rows = [];
  let i = 0;
  for (const { endpoints: eps } of GROUPS) {
    for (const ep of eps) {
      i += 1;
      rows.push(`| ${i} | ${ep.method} | \`${ep.path}\` | ${AUTH_LABEL[ep.auth]} |`);
    }
  }
  return rows.join("\n");
})()}

---
`);

  mdSections.push(markdown());

  fs.writeFileSync(path.join(OUT_DIR, "BM-Booking-API.md"), mdSections.join("\n"), "utf8");
  console.log("✓ wrote BM-Booking-API.md");

  // 3. Generated Postman collection (v2.1) for convenience
  fs.writeFileSync(
    path.join(OUT_DIR, "bm-booking-collection.json"),
    json(buildPostmanCollection()) + "\n",
    "utf8",
  );
  console.log("✓ wrote bm-booking-collection.json");
}

main();