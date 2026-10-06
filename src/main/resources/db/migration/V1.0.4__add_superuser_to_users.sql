-- Add superuser flag to users. Not written by the application; managers set it
-- directly in the database, e.g.:
--   UPDATE users SET superuser = TRUE WHERE email = 'someone@example.com';
ALTER TABLE users
    ADD COLUMN superuser BOOLEAN NOT NULL DEFAULT FALSE;
