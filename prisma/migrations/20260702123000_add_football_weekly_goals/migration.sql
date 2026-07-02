CREATE TABLE IF NOT EXISTS "football_weekly_goals" (
    "id" SERIAL NOT NULL,
    "team_id" INTEGER NOT NULL,
    "week_start" DATE NOT NULL,
    "target_trimp" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "football_weekly_goals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "football_weekly_goals_team_id_week_start_key" ON "football_weekly_goals"("team_id", "week_start");
CREATE INDEX IF NOT EXISTS "football_weekly_goals_team_id_idx" ON "football_weekly_goals"("team_id");

ALTER TABLE "football_weekly_goals" ADD CONSTRAINT "football_weekly_goals_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
