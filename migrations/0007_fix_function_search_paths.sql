-- Migration: Fix Function Search Path Security Warnings
-- Created: 2025-01-XX
-- Description: Set secure search_path for all functions to prevent SQL injection

-- ============================================================================
-- FIX: update_updated_at_column
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FIX: increment_pdf_export
-- ============================================================================

DROP FUNCTION IF EXISTS increment_pdf_export(UUID);

CREATE FUNCTION increment_pdf_export(user_uuid UUID)
RETURNS void
SET search_path = public
AS $$
BEGIN
  UPDATE users
  SET pdf_exports = COALESCE(pdf_exports, 0) + 1
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FIX: increment_data_export
-- ============================================================================

DROP FUNCTION IF EXISTS increment_data_export(UUID);

CREATE FUNCTION increment_data_export(user_uuid UUID)
RETURNS void
SET search_path = public
AS $$
BEGIN
  UPDATE users
  SET data_exports = COALESCE(data_exports, 0) + 1
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FIX: cleanup_expired_family_access
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_family_access()
RETURNS void
SET search_path = public
AS $$
BEGIN
  -- Delete expired unused invites
  DELETE FROM public.family_invites 
  WHERE expires_at < NOW() AND used_at IS NULL;
  
  -- Delete expired sessions
  DELETE FROM public.family_sessions 
  WHERE expires_at < NOW();
  
  RAISE NOTICE 'Cleaned up expired family invites and sessions';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FIX: cleanup_expired_family_sessions
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_family_sessions()
RETURNS void
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.family_sessions 
  WHERE expires_at < NOW();
  
  RAISE NOTICE 'Cleaned up expired family sessions';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FIX: rotate_family_session_token
-- ============================================================================

CREATE OR REPLACE FUNCTION rotate_family_session_token(
  p_session_id UUID,
  p_new_token TEXT
)
RETURNS void
SET search_path = public
AS $$
BEGIN
  UPDATE public.family_sessions
  SET token = p_new_token,
      expires_at = NOW() + INTERVAL '30 days'
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FIX: trigger_cleanup_expired_sessions
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_cleanup_expired_sessions()
RETURNS trigger
SET search_path = public
AS $$
BEGIN
  PERFORM cleanup_expired_family_sessions();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FIX: check_ai_budget
-- ============================================================================

CREATE OR REPLACE FUNCTION check_ai_budget(
  p_user_id UUID,
  p_operation TEXT,
  p_estimated_cost DECIMAL
)
RETURNS BOOLEAN
SET search_path = public
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_daily_spent DECIMAL;
  v_monthly_spent DECIMAL;
  v_daily_budget DECIMAL;
  v_monthly_budget DECIMAL;
BEGIN
  -- Get user budgets
  SELECT ai_daily_budget_usd, ai_monthly_budget_usd
  INTO v_daily_budget, v_monthly_budget
  FROM public.users
  WHERE id = p_user_id;

  -- If user not found, deny
  IF v_daily_budget IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Calculate daily spend (last 24 hours)
  SELECT COALESCE(SUM(cost_usd), 0)
  INTO v_daily_spent
  FROM public.ai_usage_log
  WHERE user_id = p_user_id
    AND created_at >= NOW() - INTERVAL '24 hours';

  -- Calculate monthly spend (current calendar month)
  SELECT COALESCE(SUM(cost_usd), 0)
  INTO v_monthly_spent
  FROM public.ai_usage_log
  WHERE user_id = p_user_id
    AND created_at >= DATE_TRUNC('month', NOW());

  -- Check if within budget
  IF (v_daily_spent + p_estimated_cost) > v_daily_budget THEN
    RAISE NOTICE 'User % exceeded daily AI budget (spent: $%, budget: $%)',
      p_user_id, v_daily_spent, v_daily_budget;
    RETURN FALSE;
  END IF;

  IF (v_monthly_spent + p_estimated_cost) > v_monthly_budget THEN
    RAISE NOTICE 'User % exceeded monthly AI budget (spent: $%, budget: $%)',
      p_user_id, v_monthly_spent, v_monthly_budget;
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

-- ============================================================================
-- FIX: log_ai_usage
-- ============================================================================

CREATE OR REPLACE FUNCTION log_ai_usage(
  p_user_id UUID,
  p_operation TEXT,
  p_model TEXT,
  p_tokens_used INTEGER DEFAULT NULL,
  p_cost_usd DECIMAL DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS VOID
SET search_path = public
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.ai_usage_log (
    user_id,
    operation,
    model,
    tokens_used,
    cost_usd,
    ip_address
  ) VALUES (
    p_user_id,
    p_operation,
    p_model,
    p_tokens_used,
    p_cost_usd,
    p_ip_address
  );
END;
$$;

-- ============================================================================
-- FIX: update_family_prompts_updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_family_prompts_updated_at()
RETURNS TRIGGER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- List all functions with their search_path settings
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  CASE 
    WHEN p.proconfig IS NOT NULL THEN 'SET'
    ELSE 'NOT SET'
  END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'update_updated_at_column',
    'increment_pdf_export',
    'increment_data_export',
    'cleanup_expired_family_access',
    'cleanup_expired_family_sessions',
    'rotate_family_session_token',
    'trigger_cleanup_expired_sessions',
    'check_ai_budget',
    'log_ai_usage',
    'update_family_prompts_updated_at'
  )
ORDER BY p.proname;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Fixed search_path security warnings for all public schema functions
