-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT,
  name TEXT NOT NULL DEFAULT 'User',
  birth_year INTEGER NOT NULL DEFAULT 1950,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- If the foreign key constraint is causing issues, you can temporarily disable it
-- and re-enable after inserting the user
-- ALTER TABLE stories DROP CONSTRAINT IF EXISTS stories_user_id_users_id_fk;
-- ALTER TABLE stories ADD CONSTRAINT stories_user_id_users_id_fk
--   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;