-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "gender" "Gender",
ADD COLUMN     "max_heart_rate" INTEGER,
ADD COLUMN     "resting_heart_rate" INTEGER;

-- CreateTable
CREATE TABLE "activities" (
    "id" SERIAL NOT NULL,
    "athlete_id" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "duration_min" DOUBLE PRECISION NOT NULL,
    "avg_heart_rate" DOUBLE PRECISION,
    "sport" TEXT,
    "notes" TEXT,
    "trimp" DOUBLE PRECISION,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_loads" (
    "id" SERIAL NOT NULL,
    "athlete_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "trimp" DOUBLE PRECISION NOT NULL,
    "atl" DOUBLE PRECISION NOT NULL,
    "ctl" DOUBLE PRECISION NOT NULL,
    "tsb" DOUBLE PRECISION NOT NULL,
    "ac_ratio" DOUBLE PRECISION NOT NULL,
    "monotony" DOUBLE PRECISION,
    "strain" DOUBLE PRECISION,

    CONSTRAINT "daily_loads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activities_athlete_id_date_idx" ON "activities"("athlete_id", "date");

-- CreateIndex
CREATE INDEX "daily_loads_athlete_id_idx" ON "daily_loads"("athlete_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_loads_athlete_id_date_key" ON "daily_loads"("athlete_id", "date");

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_loads" ADD CONSTRAINT "daily_loads_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
