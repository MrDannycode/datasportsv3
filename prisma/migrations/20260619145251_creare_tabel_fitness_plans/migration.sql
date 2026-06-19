-- CreateEnum
CREATE TYPE "FitnessType" AS ENUM ('forta', 'rezistenta', 'vitezare', 'flexibilitate', 'coordonare');

-- CreateTable
CREATE TABLE "fitness_plans" (
    "id" SERIAL NOT NULL,
    "created_by" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "FitnessType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fitness_plans_pkey" PRIMARY KEY ("id")
);
