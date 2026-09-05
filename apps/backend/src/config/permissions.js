const ALL_PERMISSIONS = [
  "appointments.view",
  "appointments.create",
  "appointments.approve",
  "appointments.cancel",
  "appointments.reschedule",
  "patients.view",
  "patients.create",
  "patients.history",
  "doctors.view",
  "doctors.register",
  "doctors.manage",
  "schedules.view",
  "schedules.manage",
  "equipment.view",
  "equipment.manage",
  "equipment.bookings",
  "analytics.view",
  "settings.view",
  "settings.edit",
  "staff.manage",
];

// Typical front-desk setup: appointments, patients, doctors, equipment.
const OPERATIONAL_PERMISSIONS = [
  "appointments.view",
  "appointments.create",
  "appointments.approve",
  "appointments.cancel",
  "appointments.reschedule",
  "patients.view",
  "patients.create",
  "patients.history",
  "doctors.view",
  "doctors.register",
  "doctors.manage",
  "schedules.view",
  "schedules.manage",
  "equipment.view",
  "equipment.manage",
  "equipment.bookings",
];

module.exports = { ALL_PERMISSIONS, OPERATIONAL_PERMISSIONS };