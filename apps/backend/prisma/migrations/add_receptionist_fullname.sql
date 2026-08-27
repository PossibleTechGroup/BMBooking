-- Add receptionist full name field
ALTER TABLE "receptionist_profiles" ADD COLUMN IF NOT EXISTS "full_name" TEXT;
