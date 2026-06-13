/*
  Warnings:

  - You are about to drop the column `competition` on the `football_matches` table. All the data in the column will be lost.
  - You are about to drop the column `competition` on the `tennis_matches` table. All the data in the column will be lost.
  - Added the required column `competition_id` to the `football_matches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `competition_id` to the `tennis_matches` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "football_matches" DROP COLUMN "competition",
ADD COLUMN     "competition_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "tennis_matches" DROP COLUMN "competition",
ADD COLUMN     "competition_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "competitions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sport" "Sport" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "football_matches" ADD CONSTRAINT "football_matches_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "competitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tennis_matches" ADD CONSTRAINT "tennis_matches_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "competitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
