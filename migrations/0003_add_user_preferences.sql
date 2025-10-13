-- Migration: Add User Preferences and Settings
-- Created: 2025-01-12
-- Description: Adds columns for notification preferences, privacy settings, and PDF export tracking

-- ============================================================================
-- PART 1: ADD COLUMNS TO USERS TABLE
-- ============================================================================

-- Add notification preference columns
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS weekly_digest BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS family_comments BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS printed_books_notify BOOLEAN DEFAULT false;

-- Add privacy settings
ALTER TABLE users
ADD COLUMN IF NOT EXISTS default_story_visibility BOOLEAN DEFAULT true;

-- Add export tracking
ALTER TABLE users
ADD COLUMN IF NOT EXISTS pdf_exports_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_pdf_export_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS data_exports_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_data_export_at TIMESTAMP;

-- Add timestamp for user table updates
ALTER TABLE users
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- ============================================================================
-- PART 2: CREATE INDEXES
-- ============================================================================

-- Index for checking notification preferences
CREATE INDEX IF NOT EXISTS idx_users_email_notifications ON users(email_notifications) WHERE email_notifications = true;

-- ============================================================================
-- PART 3: ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

-- Notification preferences comments
COMMENT ON COLUMN users.email_notifications IS 'Whether user wants to receive email notifications';
COMMENT ON COLUMN users.weekly_digest IS 'Whether user wants to receive weekly digest emails';
COMMENT ON COLUMN users.family_comments IS 'Whether user wants notifications for family comments';
COMMENT ON COLUMN users.printed_books_notify IS 'Whether user wants updates about printed books';

-- Privacy settings comments
COMMENT ON COLUMN users.default_story_visibility IS 'Default visibility for new stories (true = visible, false = private)';

-- Export tracking comments
COMMENT ON COLUMN users.pdf_exports_count IS 'Number of times user has exported PDF';
COMMENT ON COLUMN users.last_pdf_export_at IS 'Timestamp of last PDF export';
COMMENT ON COLUMN users.data_exports_count IS 'Number of times user has exported their data';
COMMENT ON COLUMN users.last_data_export_at IS 'Timestamp of last data export';

-- ============================================================================
-- PART 4: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to increment PDF export counter
CREATE OR REPLACE FUNCTION increment_pdf_export(user_id UUID) RETURNS void AS $$
BEGIN
  UPDATE users
  SET 
    pdf_exports_count = COALESCE(pdf_exports_count, 0) + 1,
    last_pdf_export_at = NOW(),
    updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment data export counter
CREATE OR REPLACE FUNCTION increment_data_export(user_id UUID) RETURNS void AS $$
BEGIN
  UPDATE users
  SET 
    data_exports_count = COALESCE(data_exports_count, 0) + 1,
    last_data_export_at = NOW(),
    updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
