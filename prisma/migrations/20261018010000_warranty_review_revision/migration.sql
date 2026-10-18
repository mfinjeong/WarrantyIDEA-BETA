-- Add an optimistic-concurrency token without changing existing business values.
ALTER TABLE "warrantyidea"."Warranty" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 1;
