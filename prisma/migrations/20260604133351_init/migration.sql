-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin_global', 'manager_fotbal', 'manager_tenis', 'antrenor_fotbal', 'antrenor_fitness', 'medic', 'atlet_fotbal', 'atlet_tenis');

-- CreateEnum
CREATE TYPE "Sport" AS ENUM ('fotbal', 'tenis');

-- CreateEnum
CREATE TYPE "Position" AS ENUM ('portar', 'fundas', 'mijlocas', 'atacant');

-- CreateEnum
CREATE TYPE "PreferredFoot" AS ENUM ('stanga', 'dreapta', 'ambele');

-- CreateEnum
CREATE TYPE "PreferredHand" AS ENUM ('stanga', 'dreapta');

-- CreateEnum
CREATE TYPE "PlayingStyle" AS ENUM ('baseline', 'serve_volley', 'all_court');

-- CreateEnum
CREATE TYPE "Surface" AS ENUM ('zgura', 'iarba', 'hard');

-- CreateEnum
CREATE TYPE "MatchResult" AS ENUM ('victorie', 'infrangere');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('usoara', 'medie', 'grava');

-- CreateEnum
CREATE TYPE "TrainingType" AS ENUM ('tehnic', 'fizic', 'tactic');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('create', 'update', 'delete', 'login', 'logout');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sport" "Sport" NOT NULL,
    "country" TEXT NOT NULL,
    "continent" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3),
    "nationality" TEXT,
    "phone" TEXT,
    "profile_picture" TEXT,
    "team_id" INTEGER,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "football_athletes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "position" "Position" NOT NULL,
    "jersey_number" INTEGER,
    "height_cm" DOUBLE PRECISION,
    "weight_kg" DOUBLE PRECISION,
    "preferred_foot" "PreferredFoot" NOT NULL,
    "contract_until" TIMESTAMP(3),

    CONSTRAINT "football_athletes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tennis_athletes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "height_cm" DOUBLE PRECISION,
    "weight_kg" DOUBLE PRECISION,
    "preferred_hand" "PreferredHand" NOT NULL,
    "playing_style" "PlayingStyle" NOT NULL,
    "atp_wta_ranking" INTEGER,
    "contract_until" TIMESTAMP(3),

    CONSTRAINT "tennis_athletes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "football_stats" (
    "id" SERIAL NOT NULL,
    "athlete_id" INTEGER NOT NULL,
    "match_id" INTEGER NOT NULL,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "minutes_played" INTEGER NOT NULL DEFAULT 0,
    "yellow_cards" INTEGER NOT NULL DEFAULT 0,
    "red_cards" INTEGER NOT NULL DEFAULT 0,
    "shots_on_target" INTEGER NOT NULL DEFAULT 0,
    "passes_completed" INTEGER NOT NULL DEFAULT 0,
    "km_ran" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION,

    CONSTRAINT "football_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tennis_stats" (
    "id" SERIAL NOT NULL,
    "athlete_id" INTEGER NOT NULL,
    "match_id" INTEGER NOT NULL,
    "aces" INTEGER NOT NULL DEFAULT 0,
    "double_faults" INTEGER NOT NULL DEFAULT 0,
    "first_serve_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "break_points_saved" INTEGER NOT NULL DEFAULT 0,
    "winners" INTEGER NOT NULL DEFAULT 0,
    "unforced_errors" INTEGER NOT NULL DEFAULT 0,
    "sets_won" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "tennis_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "football_matches" (
    "id" SERIAL NOT NULL,
    "team_home_id" INTEGER NOT NULL,
    "team_away_id" INTEGER NOT NULL,
    "match_date" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "score_home" INTEGER,
    "score_away" INTEGER,
    "competition" TEXT NOT NULL,

    CONSTRAINT "football_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tennis_matches" (
    "id" SERIAL NOT NULL,
    "athlete_id" INTEGER NOT NULL,
    "opponent_name" TEXT NOT NULL,
    "match_date" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "surface" "Surface" NOT NULL,
    "result" "MatchResult" NOT NULL,
    "competition" TEXT NOT NULL,

    CONSTRAINT "tennis_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_records" (
    "id" SERIAL NOT NULL,
    "athlete_id" INTEGER NOT NULL,
    "medic_id" INTEGER NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "treatment" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medical_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "injuries" (
    "id" SERIAL NOT NULL,
    "medical_record_id" INTEGER NOT NULL,
    "injury_type" TEXT NOT NULL,
    "body_part" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "recovery_days" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "injuries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_plans" (
    "id" SERIAL NOT NULL,
    "team_id" INTEGER NOT NULL,
    "created_by" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "TrainingType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fitness_sessions" (
    "id" SERIAL NOT NULL,
    "athlete_id" INTEGER NOT NULL,
    "training_plan_id" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "heart_rate_avg" INTEGER,
    "calories_burned" INTEGER,
    "notes" TEXT,

    CONSTRAINT "fitness_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "action" "AuditAction" NOT NULL,
    "table_affected" TEXT NOT NULL,
    "record_id" INTEGER,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "football_athletes_user_id_key" ON "football_athletes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tennis_athletes_user_id_key" ON "tennis_athletes"("user_id");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "football_athletes" ADD CONSTRAINT "football_athletes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tennis_athletes" ADD CONSTRAINT "tennis_athletes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "football_stats" ADD CONSTRAINT "football_stats_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "football_athletes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "football_stats" ADD CONSTRAINT "football_stats_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "football_matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tennis_stats" ADD CONSTRAINT "tennis_stats_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "tennis_athletes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tennis_stats" ADD CONSTRAINT "tennis_stats_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "tennis_matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "football_matches" ADD CONSTRAINT "football_matches_team_home_id_fkey" FOREIGN KEY ("team_home_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "football_matches" ADD CONSTRAINT "football_matches_team_away_id_fkey" FOREIGN KEY ("team_away_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tennis_matches" ADD CONSTRAINT "tennis_matches_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "tennis_athletes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "football_athletes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_medic_id_fkey" FOREIGN KEY ("medic_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "injuries" ADD CONSTRAINT "injuries_medical_record_id_fkey" FOREIGN KEY ("medical_record_id") REFERENCES "medical_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fitness_sessions" ADD CONSTRAINT "fitness_sessions_athlete_id_fkey" FOREIGN KEY ("athlete_id") REFERENCES "football_athletes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fitness_sessions" ADD CONSTRAINT "fitness_sessions_training_plan_id_fkey" FOREIGN KEY ("training_plan_id") REFERENCES "training_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
