/*
  Warnings:

  - You are about to drop the `fitness_weekly_goals` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "fitness_weekly_goals" DROP CONSTRAINT "fitness_weekly_goals_created_by_fkey";

-- DropForeignKey
ALTER TABLE "fitness_weekly_goals" DROP CONSTRAINT "fitness_weekly_goals_team_id_fkey";

-- DropTable
DROP TABLE "fitness_weekly_goals";
