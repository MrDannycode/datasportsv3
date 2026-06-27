CREATE TABLE "manager_assignments" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "country" TEXT NOT NULL,
    "continent" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manager_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "manager_assignments_user_id_key" ON "manager_assignments"("user_id");

ALTER TABLE "manager_assignments"
ADD CONSTRAINT "manager_assignments_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "manager_assignments" ("user_id", "country", "continent")
SELECT p."user_id", t."country", t."continent"
FROM "profiles" p
JOIN "users" u ON u."id" = p."user_id"
JOIN "teams" t ON t."id" = p."team_id"
WHERE u."role" = 'manager_fotbal'
ON CONFLICT ("user_id") DO NOTHING;
