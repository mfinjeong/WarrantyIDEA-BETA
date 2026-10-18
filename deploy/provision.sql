-- Run manually ONLY after backup and inspecting the existing webapp_db.
-- psql -X -W -h 127.0.0.1 -U postgres -d webapp_db -v ON_ERROR_STOP=1 -f deploy/provision.sql
-- This creates NEW roles/schema only. It aborts on name collisions.
-- It does not modify existing application schemas/tables or PUBLIC grants.
\set ON_ERROR_STOP on
BEGIN;
DO $$
BEGIN
  IF current_database() <> 'webapp_db' THEN
    RAISE EXCEPTION 'Expected existing database webapp_db';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname IN ('warrantyidea_app', 'warrantyidea_migrator')) THEN
    RAISE EXCEPTION 'Role exists. Stop and review ownership/privileges manually; do not overwrite it.';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'warrantyidea') THEN
    RAISE EXCEPTION 'Schema exists. Inspect and baseline existing data before proceeding.';
  END IF;
END $$;
CREATE ROLE warrantyidea_migrator LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE warrantyidea_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
GRANT CONNECT ON DATABASE webapp_db TO warrantyidea_migrator, warrantyidea_app;
CREATE SCHEMA warrantyidea AUTHORIZATION warrantyidea_migrator;
GRANT USAGE ON SCHEMA warrantyidea TO warrantyidea_app;
ALTER ROLE warrantyidea_app IN DATABASE webapp_db SET search_path = warrantyidea;
ALTER ROLE warrantyidea_migrator IN DATABASE webapp_db SET search_path = warrantyidea;
ALTER DEFAULT PRIVILEGES FOR ROLE warrantyidea_migrator IN SCHEMA warrantyidea
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO warrantyidea_app;
ALTER DEFAULT PRIVILEGES FOR ROLE warrantyidea_migrator IN SCHEMA warrantyidea
  GRANT USAGE, SELECT ON SEQUENCES TO warrantyidea_app;
COMMIT;
-- psql prompts locally; never put these passwords in command arguments/chat/history.
\password warrantyidea_migrator
\password warrantyidea_app
\echo 'Provisioned new schema/roles. Review existing PUBLIC privileges separately before declaring isolation complete.'
