# Schedules — Reception Dashboard

How doctor appointment schedules work in the reception web app.

## Overview

The **Schedules** page (`/schedules`) lets receptionists view and manage all doctor appointment schedules for their hospital. Data is automatically scoped to the receptionist's hospital — no manual filtering needed.

## Data model

```
Hospital
 └── DoctorProfile (has many)
      └── DoctorSchedule (has many)
           └── ScheduleSlot (has many)
                └── Booking (Appointment)
```

| Model | Table | Purpose |
|-------|-------|---------|
| `DoctorProfile` | `doctor_profiles` | Doctor linked to a hospital via `hospitalId` |
| `DoctorSchedule` | `doctor_schedules` | A date range a doctor is available (e.g. Mon–Fri 9am–5pm with 30 min slots) |
| `ScheduleSlot` | `schedule_slots` | Individual time slots generated from a schedule |
| `Booking` | `appointments` | A patient booked into a specific slot |

## Page features

### Default view — all schedules

By default the page shows **all schedules for all doctors** at the hospital, ordered by most recent. Use the **Date** filter to narrow to a specific day.

### Filters

| Filter | Behaviour |
|--------|-----------|
| **Date** | Leave empty to see all schedules. Pick a date to see only that day. |
| **Category** | Filters the doctor dropdown and schedule list by specialization. |
| **Doctor** | Shows only schedules for the selected doctor. |

### Schedule card

Each card shows:

- **Doctor name** and **specialization**
- **Date** and **time range**
- **Slot duration** (e.g. 30 min)
- **Clinic room**
- **Capacity** — booked / total slots
- **Status** badge — Active / Inactive

Click a card to **expand** it and see individual time slots with booking counts.

### Slot detail (expanded)

Each slot shows:

- Time range (e.g. 09:00 – 09:30)
- Booked / max capacity
- **FULL** label when all slots are booked

### Actions

### Creating a schedule

When you click **New Schedule**, you choose:

- **One time** — a single schedule on the selected date.
- **Repeat** — creates schedules on specific days of the week (Mon, Tue, etc.) from the start date until the chosen end date. For example: "Every Mon/Wed/Fri for 3 months."

| Action | Description |
|--------|-------------|
| **New Schedule** | Opens a modal to create a schedule. Choose one-time or repeat with day-of-week pattern. |
| **Edit** (pencil icon) | Opens the modal pre-filled with current values. |
| **Delete** (trash icon) | Removes the schedule and its slots. |

## API endpoints

All endpoints are under `/api/receptionist/` and are scoped to the receptionist's hospital via `req.receptionistProfile.hospitalId`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/schedules` | List schedules. Query params: `date`, `doctorId`, `from`, `to` |
| `GET` | `/schedules/:id` | Get a single schedule with slots |
| `POST` | `/schedules` | Create a schedule. Body: `doctorId`, `date`, `startTime`, `endTime`, `slotDuration`, `clinicRoom`, `notes`, `isActive`, `repeatWeeks` |
| `PUT` | `/schedules/:id` | Update a schedule |
| `DELETE` | `/schedules/:id` | Delete a schedule |
| `GET` | `/doctors` | List doctors at the hospital (populates the doctor dropdown) |

### GET /schedules

Query parameters (all optional):

| Param | Type | Example |
|-------|------|---------|
| `date` | ISO date | `2026-05-27` |
| `doctorId` | integer | `42` |
| `from` | ISO date | `2026-05-01` |
| `to` | ISO date | `2026-05-31` |

If no date params are sent, **all schedules** for the hospital are returned.

### POST /schedules

**One-time schedule:**

```json
{
  "doctorId": 42,
  "date": "2026-05-27",
  "startTime": "2026-05-27T09:00:00.000Z",
  "endTime": "2026-05-27T17:00:00.000Z",
  "slotDuration": 30,
  "clinicRoom": "Room 201",
  "notes": "Pediatric clinic",
  "isActive": true
}
```

**Repeat schedule (day-of-week pattern):**

```json
{
  "doctorId": 42,
  "date": "2026-06-01",
  "startTime": "2026-06-01T09:00:00.000Z",
  "endTime": "2026-06-01T17:00:00.000Z",
  "slotDuration": 30,
  "daysOfWeek": [1, 3, 5],
  "repeatEndDate": "2026-08-31",
  "clinicRoom": "Room 201",
  "notes": "Pediatric clinic — Mon/Wed/Fri"
}
```

This generates schedules for every Monday (1), Wednesday (3), and Friday (5) from June 1 to August 31.

Setting `repeatWeeks` > 1 (legacy) auto-generates schedules for that many consecutive weeks from the start date.

## Backend service

The core logic lives in `backend/src/services/receptionist.service.js`:

- `getDoctorSchedules(filters, hospitalId)` — queries `doctor_schedules` where the doctor's `hospitalId` matches
- `createDoctorSchedule(data, hospitalId)` — creates the schedule and generates slots
- `updateDoctorSchedule(id, hospitalId, data)` — partial update
- `deleteDoctorSchedule(id, hospitalId)` — removes schedule + slots

## Related

- [DOCTOR_RECEPTION_PATIENT_README.md](../DOCTOR_RECEPTION_PATIENT_README.md) — end-to-end clinical workflow
- [APPOINTMENT_GUIDE.md](APPOINTMENT_GUIDE.md) — doctor appointments and queue
- [HOSPITAL_ADMIN_GUIDE.md](HOSPITAL_ADMIN_GUIDE.md) — managing hospital staff and settings
