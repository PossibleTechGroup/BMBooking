# BM Booking Mobile App

## Overview

**BM Booking** is a healthcare appointment booking mobile application built for the Ethiopian market. It connects **patients** with **doctors** and enables booking of **medical equipment** (MRI, CT Scan, X-Ray, etc.) at hospitals and lab centers across Ethiopia.

The app serves two distinct user roles — **Patient** and **Doctor** — each with their own onboarding flow, dashboard, and feature set. It supports **English**, **Amharic**, and **Oromo** languages, and offers Ethiopian-specific features like the Ethiopian calendar, Ethiopian time format (ቀን/ሌሊት), and Telebirr mobile payment integration.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native (Expo SDK 54, New Architecture) |
| Navigation | Expo Router v6 (file-based routing) |
| State Management | Redux Toolkit + React-Redux |
| HTTP Client | Axios |
| Animations | React Native Reanimated |
| Maps | React Native Maps |
| Notifications | Expo Notifications |
| Internationalization | i18next + react-i18next |
| Date Handling | date-fns + custom Ethiopian calendar utils |
| Secure Storage | Expo SecureStore |
| Image/Video | Expo ImagePicker, Expo AV |
| Location | Expo Location |
| Payments | Telebirr H5 (external WebView) |
| Language | TypeScript |
| Build | EAS Build (Android/iOS), Expo Export (Web/PWA) |

---

## App Structure (File-Based Routing)

```
app/
├── _layout.tsx                    # Root layout (Redux Provider, auth gating, role-based navigation)
├── (auth)/
│   ├── _layout.tsx
│   └── login.tsx                  # Phone + OTP login/register
├── (patient-onboarding)/
│   ├── _layout.tsx
│   └── setup.tsx                  # Patient profile setup (name, DOB, gender, blood type)
├── (doctor-onboarding)/
│   ├── _layout.tsx
│   ├── setup.tsx                  # Doctor 3-step onboarding (professional, media, schedule)
│   └── pending.tsx                # "Under Review" waiting screen
├── (tabs)/                        # Patient main tabs
│   ├── _layout.tsx
│   ├── index.tsx                  # Home / Services
│   ├── doctors.tsx                # Find Doctors (search, filter, sort)
│   ├── equipment.tsx              # Medical Equipment search
│   ├── appointments.tsx           # My Appointments (Doctor + Lab Bookings)
│   └── profiles.tsx               # Patient Profile & Settings
├── (doctor-tabs)/                 # Doctor main tabs
│   ├── _layout.tsx
│   ├── index.tsx                  # Doctor Dashboard
│   ├── appointments.tsx           # Manage Appointments (accept/decline/complete)
│   ├── schedule.tsx               # Calendar view + schedule creation
│   ├── profile.tsx                # Doctor Profile & Performance
│   ├── edit-professional.tsx      # Edit professional details
│   └── availability.tsx           # Manage weekly availability
├── doctor/
│   └── [id].tsx                   # Doctor public profile (for patients)
├── modal.tsx                      # Multi-step booking modal
├── doctor-list.tsx                # Doctor listing by category
├── hospital-detail.tsx            # Hospital detail page
├── announcements.tsx              # Platform announcements
└── item-detail.tsx                # Equipment detail + booking
```

---

## Authentication Flow

### Phone + OTP (3-Step Process)

1. **Phone Entry** — User enters a 9-digit Ethiopian phone number (prefix `+251` hardcoded). Validated with regex `/^[79]\d{8}$/`.

2. **Role Selection** (new users only) — If the phone number is not registered, the user chooses between **Patient** or **Doctor** role.

3. **OTP Verification** — A 6-digit code is sent via SMS. The OTP input uses animated digit boxes with haptic feedback. Auto-submits on 6 digits.

- Auth state persisted via `expo-secure-store`
- Token-based API authentication (Bearer token in headers)
- Profile polling for doctors with `PendingReview` status (auto-refresh every few seconds)

### Role-Based Navigation

The root `_layout.tsx` implements a navigation guard that routes users based on:

| Condition | Route |
|-----------|-------|
| No token | `(auth)/login` |
| Doctor, no profile | `(doctor-onboarding)/setup` |
| Doctor, pending review | `(doctor-onboarding)/pending` |
| Doctor, approved | `(doctor-tabs)` |
| Patient, no profile | `(patient-onboarding)/setup` |
| Patient, profile exists | `(tabs)` |

---

## Patient Features

### Home / Services Tab
- Welcome greeting with user's name
- Search bar (links to Doctors tab)
- Telegram-style notification bubble (welcome message)
- Featured doctors list (top 3) with rating, specialization, clinic info
- "Book Appointment" CTA per doctor
- Pull-to-refresh

### Find Doctors Tab
- **Search** by name, specialization, or address
- **Sort** by Rating or Distance (uses device GPS + haversine formula)
- **Filter** by Specialty (Cardiology, Neurology, Dermatology, Pediatrics, etc.), Rating threshold, Price range
- Doctor cards showing: name, specializations, clinic, rating, distance, profile picture/video
- "Book" button directly from card

### Medical Equipment Tab
- Equipment categories: MRI, CT Scan, Dialysis, Ultrasound, X-Ray, Ventilator, ECG, Mammography, Defibrillator
- Search by name or city
- Equipment cards with: name, category, hospital, address, operational status
- Horizontal announcements carousel
- Links to equipment detail page for booking

### Appointments Tab
- **Two sub-tabs**: Doctor Bookings | Lab Bookings
- **Status filters**: All, Pending, Accepted, Completed, Cancelled
- Appointment cards showing: doctor/equipment name, status badge, date, time, clinic info
- **Actions per status**:
  - Pending/Accepted → Reschedule (date + slot picker), Cancel
  - Completed → Rate Doctor (star rating + comment modal)
- **Reschedule modal**: Shows available dates from doctor's schedule, time slots with capacity indicators ("3 left", "Full")
- Lab booking reschedule with date range picker (next 30 days)

### Profile Tab
- Profile info display (name, phone)
- Account settings:
  - **Profile Information**: Edit name, gender, DOB (with Ethiopian/Gregorian calendar picker), blood type, emergency contact
  - **Notifications**: Toggle appointment reminders, doctor messages, health tips
  - **Privacy**: Medical history sharing, doctor profile access, analytics
  - **Date & Time**: Toggle between AM/PM and Ethiopian (ቀን/ሌሊት) time format; Gregorian vs Ethiopian calendar
- Legal links (Privacy Policy, Terms of Service)
- Sign out

### Booking Flow (Modal)
Multi-step booking wizard:

1. **Sponsor** — Booking for self or someone else
2. **Issue** — Select medical category/issue
3. **Recommendations** — AI-suggested doctors based on category
4. **Referrals** — Upload referral attachments (optional)
5. **Date/Time** — Select from doctor's available schedule slots
6. **Payment** — Telebirr H5 payment integration
7. **Confirm** — Review and submit
8. **Success** — Confirmation screen

### Doctor Profile Page (Public)
- Profile picture, name, specializations
- Intro video player
- Bio, experience, license info
- Clinic details with map
- Patient reviews with star ratings
- Submit/edit review functionality
- "Book Appointment" CTA

---

## Doctor Features

### Dashboard Tab
- Greeting with doctor's first name
- Stats grid: Today's appointments, Pending requests, Upcoming scheduled
- Upcoming tasks list (next 5 appointments)
- Pull-to-refresh

### Appointments Tab
- **Week strip calendar** with appointment indicators (dots, pending badges)
- **Day view** with appointment list sorted by time
- **Swipe navigation** between days (PanResponder)
- "Today" quick-jump button
- **Appointment detail dropdown** (bottom sheet modal):
  - Patient name, phone, status badge
  - Date, time, reason
  - Referral attachments (image viewer)
  - **Actions**:
    - Pending → Accept / Decline (with reason modal)
    - Accepted → Complete
    - Completed → Schedule Follow-Up
- **Follow-Up scheduling**: Pick date, select from available time slots, add reason
- **Decline modal**: Required reason text input
- Color-coded status system (yellow=pending, green=accepted, blue=completed, red=declined)

### Schedule Tab
- **Google Calendar-style time grid** (6 AM – 9 PM)
- Visual blocks for: schedules (blue), availability (green), appointments (color-coded)
- **Current time red line indicator**
- Week strip with event indicators
- **Pending requests banner** (yellow alert bar)
- **FAB** → Create new time slot:
  - **Weekly recurring** (select multiple days) or **One-time**
  - Start/end time pickers
  - Slot duration (15/20/30/45/60 min)
  - Hospital selection
- **Share** schedule via WhatsApp, SMS, Telegram, or export as CSV
- Auto-refresh every 30 seconds
- Swipe navigation between days

### Profile Tab
- Profile header (picture or initials, name, specializations, clinic)
- **Your Performance** component: rating display, review count, patient reviews list
- Menu items:
  - Professional Details (edit)
  - App Settings (date/time format toggle)
  - Privacy Policy, Terms of Service
- Sign out

### Edit Professional Details
- Full name, specializations (select up to 2 from 50+ medical specialties)
- Experience years, license number, professional bio
- Profile photo (camera or gallery, 10MB limit)
- Intro video (camera or gallery, 50MB limit)
- Form validation with error messages

### Availability Management
- Weekly schedule builder
- Add/edit/delete schedule entries per day
- Day chips (Mon–Sun) with time pickers
- Location (hospital/clinic name)
- Overlap detection validation
- Save all entries to backend

---

## Doctor Onboarding (3-Step)

1. **Step 1 — Professional Details**: Full name, specializations (searchable modal with 50+ specialties), experience, license number, bio
2. **Step 2 — Identity & Media**: Profile photo upload, optional intro video
3. **Step 3 — Schedule**: Weekly availability schedule with day/time/location

- Animated step transitions with progress indicator
- Form validation at each step
- Rejection banner shown if profile was rejected (with reason)
- Error slide banner for API errors
- Submit sends FormData with file uploads to backend

---

## Patient Onboarding

Single-step profile setup:
- Full name
- Date of birth (Ethiopian or Gregorian calendar picker)
- Gender (Male/Female/Other chips)
- Blood type (A+, A-, B+, B-, AB+, AB-, O+, O-) — optional
- Emergency contact — optional

---

## State Management (Redux Toolkit)

7 slices in the store:

| Slice | Purpose |
|-------|---------|
| `authSlice` | User auth, token, OTP flow, profile status, doctor profile CRUD, availability, profile polling |
| `appointmentSlice` | Patient appointments, doctor appointments, categories, recommendations, stats, schedules, follow-ups |
| `doctorSlice` | Doctor list fetching |
| `patientSlice` | Patient profile CRUD |
| `equipmentSlice` | Equipment search, categories, announcements, bookings, availability |
| `hospitalSlice` | Hospital list |
| `announcementSlice` | Platform announcements |

---

## Design System

### Theme (`constants/theme.ts`)
- **Light mode**: Warm off-white background (`#F9F7F2`), charcoal primary (`#1A1A1A`), emerald success (`#027A48`)
- **Dark mode**: Dark background (`#1A1A1A`), light cream text (`#F9F7F2`)
- System color scheme detection with manual toggle

### Components
- `MedText` — Typography component with variant system (h1, h2, body, metadata)
- `MedCard` — Card container with themed styling
- `MedButton` — Button with primary/outline variants, loading state
- `MedInput` — Text input with label and error state
- `MedLoadingOverlay` — Full-screen loading spinner
- `TelegramBubble` — Chat-style notification bubble
- `DatePickerModal` — Dual-calendar date picker (Gregorian/Ethiopian)
- `LanguagePicker` — Language switcher dropdown
- `MapViewWrapper` — Native maps (React Native Maps) / web fallback
- `DoctorCard`, `SearchSection`, `SortRow`, `SpecialtyChips`, `FilterModal` — Doctor search components
- `SponsorPicker`, `ReferralUploader` — Booking flow components
- `YourPerformance` — Doctor performance/reviews display
- `RejectionBanner`, `ErrorSlideBanner`, `Step1Professional`, `Step2Media`, `Step3Schedule`, `SpecializationModal`, `ScheduleModal`, `MediaPickerModal` — Onboarding components

### Animations
- Spring-based animations via `react-native-reanimated`
- Field shake animation for validation errors
- Digit pop animation for OTP input
- Fade-in-down, slide-in-right transitions for lists and modals
- Layout animations for step transitions

---

## Internationalization

Three languages with full translation coverage (~200+ keys each):

| Language | Code | Coverage |
|----------|------|----------|
| English | `en` | Full |
| Amharic | `am` | Full |
| Oromo | `om` | Full |

- Language persisted in SecureStore
- System language auto-detected on first launch
- Language picker available in login, home, and equipment screens

---

## Ethiopian-Specific Features

### Ethiopian Calendar
- Full Ethiopian calendar support (Meskerem through Pagumē)
- Date picker supports both Gregorian and Ethiopian calendar systems
- Dates displayed as "ሰኔ 9, 2018" format

### Ethiopian Time Format
- 12-hour format with ቀን (day, 6AM-6PM) and ሌሊት (night, 6PM-6AM)
- Example: "3:30 ሌሊት" instead of "9:30 PM"
- Toggleable in settings per user preference

### Telebirr Payment
- Integration with Telebirr H5 payment gateway
- External URL for payment processing
- Configurable via environment variables

### Phone Number Format
- Ethiopian phone numbers only (prefix +251)
- 9-digit validation starting with 7 or 9

---

## Environment Configuration

| Variable | Purpose | Default |
|----------|---------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API URL | `http://localhost:52400` |
| `EXPO_PUBLIC_TELEBIRR_URL` | Telebirr H5 URL | `http://<LOCAL_IP>:53402` |
| `EXPO_PUBLIC_LOCAL_IP` | LAN IP for phone testing | `192.168.1.21` |

---

## Build & Deployment

```bash
# Development
npm run dev              # Expo dev server (LAN, port 8081)
npm run dev:tunnel       # Expo dev server (tunnel mode)

# Production Builds
npm run build:android    # EAS Build for Android
npm run build:ios        # EAS Build for iOS
npm run build:all        # Both platforms
npm run build:web        # Static web export (PWA)

# Quality
npm run lint             # ESLint via expo lint
```

- Android package: `com.bmbooking`
- EAS project ID: `c978ff5c-73e7-4900-9301-bf29287e8e5c`
- Web output: Static PWA with service worker registration
- Owner: `abelashine`

---

## Data Models (TypeScript Interfaces)

### User
```typescript
{
  id: number;
  phone: string;
  role: "patient" | "doctor";
  fullName?: string;
  patientProfile?: PatientProfile;
  doctorProfile?: DoctorProfile;
}
```

### DoctorProfile
```typescript
{
  id: number;
  fullName: string;
  specialization: string;
  specializations: string[];
  experienceYears: number;
  bio: string;
  licenseNumber: string;
  profilePicture: string;
  introVideo: string;
  clinicName: string;
  clinicAddress: string;
  rating: number;
  totalReviews: number;
  hospital?: Hospital;
  availability: AvailabilityEntry[];
}
```

### Appointment
```typescript
{
  id: number;
  dateTime: string;
  status: "pending" | "accepted" | "completed" | "declined" | "cancelled";
  reason: string;
  declineReason?: string;
  doctor: DoctorProfile;
  patient: User;
  bookedBy: User;
  attachments: string[];
  followUps: Appointment[];
  parentAppointmentId?: number;
}
```

### Equipment
```typescript
{
  id: number;
  name: string;
  category: string;
  hospitalName: string;
  address: string;
  isOperational: boolean;
}
```

---

## Key Interactions Summary

| Patient Action | Doctor Action |
|---------------|---------------|
| Browse services | View dashboard stats |
| Search/filter doctors | Manage appointment requests |
| Book appointment (multi-step) | Accept/decline with reason |
| Upload referral | View referral attachments |
| Pay via Telebirr | Complete appointment |
| Reschedule appointment | Schedule follow-up |
| Cancel appointment | Create weekly/one-time schedules |
| Rate & review doctor | View performance & reviews |
| Search medical equipment | Edit professional details |
| Book equipment slot | Manage availability |
| Manage profile & settings | Share schedule (WhatsApp/SMS/CSV) |
| Switch language (EN/AM/OM) | Toggle time/calendar format |
| Toggle Ethiopian time/calendar | View patient details |
