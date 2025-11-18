-- Migration: Add last_story_notification_sent_at to family_members table
-- Purpose: Track when family members were last notified about new stories
-- This enables daily digest notifications without sending duplicates
-- Created: 2025-11-18

-- Add the notification timestamp column to family_members
ALTER TABLE family_members
ADD COLUMN last_story_notification_sent_at TIMESTAMP;

-- Add comment to explain the column's purpose
COMMENT ON COLUMN family_members.last_story_notification_sent_at IS
'Timestamp of the last story notification email sent to this family member. Used by daily digest cron job to prevent duplicate notifications.';

-- Create index for efficient querying of family members who need notifications
-- This index supports queries like:
-- SELECT * FROM family_members
-- WHERE user_id = ?
-- AND (last_story_notification_sent_at IS NULL OR last_story_notification_sent_at < NOW() - INTERVAL '24 hours')
CREATE INDEX idx_family_members_notification_tracking
ON family_members(user_id, last_story_notification_sent_at);

-- Add comment to the index
COMMENT ON INDEX idx_family_members_notification_tracking IS
'Optimizes queries for finding family members who need story notification emails. Used by daily digest cron job.';
