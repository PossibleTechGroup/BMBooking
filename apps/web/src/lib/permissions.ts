export interface PermissionKey {
  key: string;
  group: string;
  label: string;
}

export const PERMISSION_GROUPS: { group: string; items: PermissionKey[] }[] = [
  {
    group: 'Appointments',
    items: [
      { key: 'appointments.view', group: 'Appointments', label: 'View appointments' },
      { key: 'appointments.create', group: 'Appointments', label: 'Create/update appointments' },
      { key: 'appointments.approve', group: 'Appointments', label: 'Approve / deny appointments' },
      { key: 'appointments.cancel', group: 'Appointments', label: 'Cancel appointments' },
      { key: 'appointments.reschedule', group: 'Appointments', label: 'Reschedule & reorder' },
    ],
  },
  {
    group: 'Patients',
    items: [
      { key: 'patients.view', group: 'Patients', label: 'View patients' },
      { key: 'patients.create', group: 'Patients', label: 'Register patients' },
      { key: 'patients.history', group: 'Patients', label: 'View patient history' },
    ],
  },
  {
    group: 'Doctors',
    items: [
      { key: 'doctors.view', group: 'Doctors', label: 'View doctors' },
      { key: 'doctors.register', group: 'Doctors', label: 'Register doctors' },
      { key: 'doctors.manage', group: 'Doctors', label: 'Manage doctors' },
    ],
  },
  {
    group: 'Schedules',
    items: [
      { key: 'schedules.view', group: 'Schedules', label: 'View schedules' },
      { key: 'schedules.manage', group: 'Schedules', label: 'Manage schedules' },
    ],
  },
  {
    group: 'Equipment',
    items: [
      { key: 'equipment.view', group: 'Equipment', label: 'View equipment' },
      { key: 'equipment.manage', group: 'Equipment', label: 'Manage equipment' },
      { key: 'equipment.bookings', group: 'Equipment', label: 'Manage equipment bookings' },
    ],
  },
  {
    group: 'Reports & Settings',
    items: [
      { key: 'analytics.view', group: 'Reports & Settings', label: 'View stats & analytics' },
      { key: 'settings.view', group: 'Reports & Settings', label: 'View settings & services' },
      { key: 'settings.edit', group: 'Reports & Settings', label: 'Edit settings & services' },
      { key: 'staff.manage', group: 'Reports & Settings', label: 'Manage staff' },
    ],
  },
];

export const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => i.key));

export const ALL_PERMISSIONS = [...ALL_PERMISSION_KEYS];

// Permissions that can never be granted to staff — they are owner-only.
export const OWNER_ONLY_PERMISSIONS = ['staff.manage', 'settings.edit'];

// The subset of permissions a receptionist can actually be granted.
export const GRANTABLE_PERMISSIONS = ALL_PERMISSIONS.filter(
  (key) => !OWNER_ONLY_PERMISSIONS.includes(key)
);

export const OPERATIONAL_PERMISSIONS = [
  'appointments.view',
  'appointments.create',
  'appointments.approve',
  'appointments.cancel',
  'appointments.reschedule',
  'patients.view',
  'patients.create',
  'patients.history',
  'doctors.view',
  'doctors.register',
  'doctors.manage',
  'schedules.view',
  'schedules.manage',
  'equipment.view',
  'equipment.manage',
  'equipment.bookings',
];

export function hasPermission(permissions: string[] | undefined, hospitalRole: string | null | undefined, key: string): boolean {
  if (hospitalRole === 'owner') return true;
  return (permissions || []).includes(key);
}