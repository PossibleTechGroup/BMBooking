-- Add hospital_id column to doctor_schedules
ALTER TABLE doctor_schedules ADD COLUMN IF NOT EXISTS hospital_id INTEGER REFERENCES hospitals(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_hospital_id ON doctor_schedules(hospital_id);

-- Backfill hospital_id from the doctor's home hospital for existing schedules
UPDATE doctor_schedules ds
SET hospital_id = dp.hospital_id
FROM doctor_profiles dp
WHERE ds.doctor_id = dp.id AND ds.hospital_id IS NULL;

-- Add created_by_id column to doctor_schedules
ALTER TABLE doctor_schedules ADD COLUMN IF NOT EXISTS created_by_id INTEGER REFERENCES receptionist_profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_doctor_schedules_created_by_id ON doctor_schedules(created_by_id);
