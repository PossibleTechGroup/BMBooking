-- CreateEnum
CREATE TYPE "HospitalProfileStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'hospital';

-- DropForeignKey
ALTER TABLE "hospital_services" DROP CONSTRAINT "hospital_services_hospital_id_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_doctor_id_fkey";

-- DropIndex
DROP INDEX "idx_doctor_schedules_created_by_id";

-- DropIndex
DROP INDEX "idx_doctor_schedules_hospital_id";

-- DropIndex
DROP INDEX "hospital_services_name_idx";

-- AlterTable
ALTER TABLE "hospital_services" ALTER COLUMN "name" SET DATA TYPE TEXT,
ALTER COLUMN "category" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "hospital_profiles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "hospital_id" INTEGER NOT NULL,
    "status" "HospitalProfileStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hospital_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hospital_profiles_user_id_key" ON "hospital_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "hospital_services" ADD CONSTRAINT "hospital_services_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_profiles" ADD CONSTRAINT "hospital_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hospital_profiles" ADD CONSTRAINT "hospital_profiles_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctor_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

