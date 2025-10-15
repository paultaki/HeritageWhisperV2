-- Migration: Add Role-Based Access Control
-- Created: 2025-10-15
-- Description: Add user roles for admin authorization

-- Add role column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
CHECK (role IN ('user', 'admin', 'moderator'));

-- Create index for efficient role lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Add role to existing users (all default to 'user')
UPDATE public.users SET role = 'user' WHERE role IS NULL;

-- Grant admin role to specific emails (UPDATE THIS LIST BEFORE RUNNING)
-- IMPORTANT: Replace these with your actual admin emails
UPDATE public.users
SET role = 'admin'
WHERE email IN (
  'paul@heritagewhisper.com',
  'paultaki@gmail.com',
  'admin@heritagewhisper.com'
);

-- Create audit log table for admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_user_id
ON public.admin_audit_log(admin_user_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at
ON public.admin_audit_log(created_at DESC);

COMMENT ON TABLE public.admin_audit_log IS 'Audit trail for all admin actions';
COMMENT ON COLUMN public.users.role IS 'User role for RBAC: user, admin, or moderator';

-- Verification query
SELECT
  email,
  role,
  created_at
FROM public.users
WHERE role = 'admin'
ORDER BY created_at;
