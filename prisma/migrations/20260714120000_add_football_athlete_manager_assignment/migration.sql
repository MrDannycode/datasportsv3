ALTER TABLE "football_athletes"
ADD COLUMN "manager_assignment_id" INTEGER;

CREATE INDEX "football_athletes_manager_assignment_id_idx"
ON "football_athletes"("manager_assignment_id");

ALTER TABLE "football_athletes"
ADD CONSTRAINT "football_athletes_manager_assignment_id_fkey"
FOREIGN KEY ("manager_assignment_id") REFERENCES "manager_assignments"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Recover ownership for athletes created by the existing invitation flow.
UPDATE "football_athletes" AS athlete
SET "manager_assignment_id" = assignment."id"
FROM "audit_logs" AS audit
JOIN "manager_assignments" AS assignment
  ON assignment."user_id" = audit."user_id"
WHERE audit."record_id" = athlete."user_id"
  AND audit."action" = 'create'
  AND audit."table_affected" = 'users'
  AND audit."details"->>'source' = 'athlete_invite'
  AND athlete."manager_assignment_id" IS NULL;
