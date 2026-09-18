-- AlterTable: make doctor_id nullable on reviews and add hospital_id
ALTER TABLE "reviews" ALTER COLUMN "doctor_id" DROP NOT NULL;

ALTER TABLE "reviews" ADD COLUMN "hospital_id" INTEGER;

-- Replace the per-appointment unique constraint with per-target uniques
DROP INDEX IF EXISTS "reviews_appointment_id_key";

CREATE UNIQUE INDEX "reviews_appointment_id_doctor_id_key" ON "reviews"("appointment_id", "doctor_id");
CREATE UNIQUE INDEX "reviews_appointment_id_hospital_id_key" ON "reviews"("appointment_id", "hospital_id");
CREATE INDEX "reviews_doctor_id_idx" ON "reviews"("doctor_id");
CREATE INDEX "reviews_hospital_id_idx" ON "reviews"("hospital_id");

ALTER TABLE "reviews" ADD CONSTRAINT "reviews_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: add rating + total_reviews to hospitals
ALTER TABLE "hospitals" ADD COLUMN "rating" DOUBLE PRECISION NOT NULL DEFAULT 0.0;
ALTER TABLE "hospitals" ADD COLUMN "total_reviews" INTEGER NOT NULL DEFAULT 0;