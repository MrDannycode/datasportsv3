/*
  Warnings:

  - You are about to drop the column `team_id` on the `training_plans` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "training_plans" DROP CONSTRAINT "training_plans_team_id_fkey";

-- AlterTable
ALTER TABLE "training_plans" DROP COLUMN "team_id";
