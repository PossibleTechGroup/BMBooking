-- AlterTable: add permission matrix to receptionist profiles (owner-only management)
ALTER TABLE "receptionist_profiles" ADD COLUMN "permissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];