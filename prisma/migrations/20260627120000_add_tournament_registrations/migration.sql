CREATE TYPE "RegistrationStatus" AS ENUM ('inscris', 'retras');

CREATE TABLE "tournament_registrations" (
  "id" SERIAL NOT NULL,
  "tournament_id" INTEGER NOT NULL,
  "athlete_id" INTEGER NOT NULL,
  "status" "RegistrationStatus" NOT NULL DEFAULT 'inscris',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "tournament_registrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tournament_registrations_tournament_id_athlete_id_key" ON "tournament_registrations"("tournament_id", "athlete_id");

CREATE INDEX "tournament_registrations_athlete_id_idx" ON "tournament_registrations"("athlete_id");

ALTER TABLE "tournament_registrations" ADD CONSTRAINT "tournament_registrations_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tournament_registrations" ADD CONSTRAINT "tournament_registrations_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "tennis_athletes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
