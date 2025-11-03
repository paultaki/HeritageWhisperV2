# Admin Setup Instructions

## Problem
You're getting a 403 error when trying to rate prompts because:
1. Your user account doesn't have the `admin` role
2. The `prompt_feedback` table might not exist in your database

## Solution

### Step 1: Get Your User Email
First, figure out which email you're logged in with. Open the browser console and type:
```javascript
localStorage.getItem('supabase.auth.token')
```
Or just check your login email.

### Step 2: Run SQL in Supabase

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/tjycibrhoammxohemyhq
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste this SQL (UPDATE THE EMAIL FIRST!):

```sql
-- 1. Create prompt_feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS prompt_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES active_prompts(id),
  prompt_text TEXT NOT NULL,
  story_id UUID REFERENCES stories(id),
  story_excerpt TEXT,
  rating TEXT NOT NULL CHECK (rating IN ('good', 'bad', 'excellent', 'terrible')),
  feedback_notes TEXT,
  tags TEXT[],
  prompt_tier INTEGER,
  prompt_type TEXT,
  anchor_entity TEXT,
  word_count INTEGER,
  prompt_score REAL,
  quality_report JSONB,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_prompt_feedback_reviewed_at
  ON prompt_feedback(reviewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_prompt_feedback_rating
  ON prompt_feedback(rating);

CREATE INDEX IF NOT EXISTS idx_prompt_feedback_tier
  ON prompt_feedback(prompt_tier);

-- 3. Enable RLS
ALTER TABLE prompt_feedback ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
DROP POLICY IF EXISTS "Admins can view all feedback" ON prompt_feedback;
CREATE POLICY "Admins can view all feedback"
  ON prompt_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert feedback" ON prompt_feedback;
CREATE POLICY "Admins can insert feedback"
  ON prompt_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

-- 5. Set your user as admin
-- ⚠️ UPDATE THIS EMAIL TO MATCH YOUR ACCOUNT!
UPDATE users
SET role = 'admin'
WHERE email = 'paul@heritagewhisper.com'; -- CHANGE THIS!

-- 6. Verify it worked
SELECT id, email, role, created_at
FROM users
WHERE role = 'admin';
```

5. Click "Run" (or press Cmd/Ctrl + Enter)
6. You should see your user listed with role = 'admin'

### Step 3: Test It

1. Refresh your browser on the Prompt Feedback page
2. Try rating a prompt again
3. It should work now! 🎉

## What Each Part Does

- **prompt_feedback table**: Stores your ratings and feedback on prompts
- **Indexes**: Makes queries fast when filtering by rating, tier, etc.
- **RLS policies**: Ensures only admins can access this table
- **role = 'admin'**: Gives your account admin privileges

## Troubleshooting

### Still Getting 403?
1. Check if your email was updated correctly:
   ```sql
   SELECT email, role FROM users WHERE email = 'your-email@example.com';
   ```

2. Make sure you're logged in with the same email

3. Try logging out and back in to refresh your session

### Table Already Exists Error?
That's fine! The `IF NOT EXISTS` clause means it will just skip creating it.

### Can't Find Users Table?
The `users` table should exist. If not, you might need to run the initial migrations first.

## Quick Verification Query

Run this to see your admin status:
```sql
SELECT
  u.id,
  u.email,
  u.role,
  COUNT(pf.id) as feedback_count
FROM users u
LEFT JOIN prompt_feedback pf ON pf.reviewed_by = u.id
WHERE u.role = 'admin'
GROUP BY u.id, u.email, u.role;
```

This shows all admins and how many prompts they've reviewed.
