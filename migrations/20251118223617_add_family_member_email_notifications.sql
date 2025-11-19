-- Migration: Add email_notifications preference to family_members table
-- Purpose: Allow family members to opt-out of story notification emails via unsubscribe link
-- Created: 2025-11-18

-- Add the email notification preference column to family_members
-- Default to TRUE so existing family members continue receiving emails
ALTER TABLE family_members
ADD COLUMN email_notifications BOOLEAN NOT NULL DEFAULT TRUE;

-- Add comment to explain the column's purpose
COMMENT ON COLUMN family_members.email_notifications IS
'Whether this family member wants to receive email notifications about new stories. Can be toggled via unsubscribe link in notification emails.';

-- Create index for efficient querying of family members who want notifications
-- This supports queries in the daily digest cron job:
-- SELECT * FROM family_members WHERE status = 'active' AND email_notifications = TRUE
CREATE INDEX idx_family_members_email_notifications
ON family_members(user_id, status, email_notifications);

-- Add comment to the index
COMMENT ON INDEX idx_family_members_email_notifications IS
'Optimizes queries for finding family members who want email notifications. Used by daily digest cron job.';
