/*
  Warnings:

  - You are about to drop the `football_weekly_goals` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "football_weekly_goals" DROP CONSTRAINT "football_weekly_goals_team_id_fkey";

-- DropTable
DROP TABLE "football_weekly_goals";
