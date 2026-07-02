-- CreateTable
CREATE TABLE "fitness_weekly_goals" (
    "id" SERIAL NOT NULL,
    "team_id" INTEGER NOT NULL,
    "week_start" DATE NOT NULL,
    "target_trimp" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fitness_weekly_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fitness_weekly_goals_team_id_idx" ON "fitness_weekly_goals"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "fitness_weekly_goals_team_id_week_start_key" ON "fitness_weekly_goals"("team_id", "week_start");

-- AddForeignKey
ALTER TABLE "fitness_weekly_goals" ADD CONSTRAINT "fitness_weekly_goals_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
