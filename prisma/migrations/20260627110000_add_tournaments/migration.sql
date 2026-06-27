CREATE TABLE IF NOT EXISTS "tournaments" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "location" TEXT,
  "surface" "Surface",
  "start_date" TIMESTAMP(3) NOT NULL,
  "end_date" TIMESTAMP(3),
  "external_id" TEXT,
  "source_url" TEXT,
  "last_sync_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tournaments_external_id_key" ON "tournaments"("external_id");

CREATE TABLE IF NOT EXISTS "tournament_players" (
  "id" SERIAL NOT NULL,
  "tournament_id" INTEGER NOT NULL,
  "player_name" TEXT NOT NULL,
  "atp_wta_ranking" INTEGER,
  "nationality" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "tournament_players_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tournament_players_tournament_id_fkey'
  ) THEN
    ALTER TABLE "tournament_players" ADD CONSTRAINT "tournament_players_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
