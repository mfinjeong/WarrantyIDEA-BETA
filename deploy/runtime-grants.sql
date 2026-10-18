-- Apply as migration role AFTER each successful migrate deploy, in webapp_db.
-- Restrict the runtime user from modifying Prisma's migration bookkeeping.
\set ON_ERROR_STOP on
BEGIN;
DO $$
BEGIN
  IF current_database() <> 'webapp_db' OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'warrantyidea_app') THEN
    RAISE EXCEPTION 'Expected webapp_db with provisioned warrantyidea_app';
  END IF;
END $$;
GRANT USAGE ON SCHEMA warrantyidea TO warrantyidea_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA warrantyidea TO warrantyidea_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA warrantyidea TO warrantyidea_app;
REVOKE ALL PRIVILEGES ON TABLE warrantyidea._prisma_migrations FROM warrantyidea_app;
COMMIT;
