-- AddForeignKey
ALTER TABLE "fitness_plans"
ADD CONSTRAINT "fitness_plans_created_by_fkey"
FOREIGN KEY ("created_by") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;