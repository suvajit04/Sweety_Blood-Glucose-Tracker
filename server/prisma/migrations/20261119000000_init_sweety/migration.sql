CREATE TYPE "UserRole" AS ENUM ('PATIENT', 'DOCTOR');
CREATE TYPE "TimeSlot" AS ENUM ('MORNING_FASTING', 'AFTER_BREAKFAST', 'AFTER_LUNCH', 'AFTER_DINNER');

CREATE TABLE "users" (
  "id" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "password_hash" VARCHAR(255) NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'PATIENT',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "readings" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "date" DATE NOT NULL,
  "time_slot" "TimeSlot" NOT NULL,
  "value" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "readings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "doctor_patients" (
  "id" UUID NOT NULL,
  "doctor_id" UUID NOT NULL,
  "patient_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "doctor_patients_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "readings_user_id_date_time_slot_key" ON "readings"("user_id", "date", "time_slot");
CREATE INDEX "readings_user_id_date_idx" ON "readings"("user_id", "date");
CREATE UNIQUE INDEX "doctor_patients_doctor_id_patient_id_key" ON "doctor_patients"("doctor_id", "patient_id");
CREATE INDEX "doctor_patients_doctor_id_idx" ON "doctor_patients"("doctor_id");
CREATE INDEX "doctor_patients_patient_id_idx" ON "doctor_patients"("patient_id");

ALTER TABLE "readings" ADD CONSTRAINT "readings_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "doctor_patients" ADD CONSTRAINT "doctor_patients_doctor_id_fkey"
FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "doctor_patients" ADD CONSTRAINT "doctor_patients_patient_id_fkey"
FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
