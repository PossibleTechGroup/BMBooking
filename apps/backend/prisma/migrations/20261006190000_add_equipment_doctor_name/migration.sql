-- Add optional doctor assignment to medical equipment
ALTER TABLE "medical_equipment" ADD COLUMN IF NOT EXISTS "doctor_name" TEXT;
