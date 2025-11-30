-- Migration: Add get_user_collaborations RPC Function
-- Created: 2025-11-29
-- Description: Returns all storyteller accounts a user can access (self + family sharing)

-- ============================================================================
-- CREATE RPC FUNCTION: get_user_collaborations
-- ============================================================================

-- Drop if exists to allow re-running
DROP FUNCTION IF EXISTS get_user_collaborations(UUID);

CREATE OR REPLACE FUNCTION get_user_collaborations(p_user_id UUID)
RETURNS TABLE(
  storyteller_id UUID,
  storyteller_name TEXT,
  permission_level TEXT,
  relationship TEXT,
  last_viewed_at TIMESTAMPTZ
)
SET search_path = public
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  -- First: Return self (owner of their own stories)
  SELECT
    u.id AS storyteller_id,
    COALESCE(u.name, 'My Stories') AS storyteller_name,
    'owner'::TEXT AS permission_level,
    NULL::TEXT AS relationship,
    NULL::TIMESTAMPTZ AS last_viewed_at
  FROM public.users u
  WHERE u.id = p_user_id

  UNION ALL

  -- Second: Return storytellers where user is a family member with active status
  SELECT
    fm.user_id AS storyteller_id,
    COALESCE(owner.name, owner.email, 'Storyteller') AS storyteller_name,
    COALESCE(fm.permission_level, 'viewer') AS permission_level,
    fm.relationship,
    fm.last_accessed_at AS last_viewed_at
  FROM public.family_members fm
  JOIN public.users owner ON owner.id = fm.user_id
  WHERE fm.email = (SELECT email FROM public.users WHERE id = p_user_id)
    AND fm.status = 'active'

  ORDER BY permission_level DESC, storyteller_name;
END;
$$;

-- ============================================================================
-- ADD COMMENTS
-- ============================================================================

COMMENT ON FUNCTION get_user_collaborations(UUID) IS
'Returns all storyteller accounts the specified user can access. Includes self (as owner) and any family members where the user has been invited.';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Allow authenticated users to call this function
GRANT EXECUTE ON FUNCTION get_user_collaborations(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_collaborations(UUID) TO service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
