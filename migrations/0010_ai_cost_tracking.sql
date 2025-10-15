-- Migration: AI Cost Tracking
-- Created: 2025-10-15
-- Description: Track AI usage and costs per user to prevent abuse

-- ============================================================================
-- AI USAGE LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  operation TEXT NOT NULL,  -- 'tier3', 'whisper', 'transcribe', 'lesson', etc.
  model TEXT NOT NULL,      -- 'gpt-4o', 'gpt-5', 'whisper-1', etc.
  tokens_used INTEGER,
  cost_usd DECIMAL(10, 6),  -- Cost in USD (6 decimal places for precision)
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ai_usage_log_user_id
ON public.ai_usage_log(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_created_at
ON public.ai_usage_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_operation
ON public.ai_usage_log(operation);

CREATE INDEX IF NOT EXISTS idx_ai_usage_log_user_date
ON public.ai_usage_log(user_id, created_at DESC);

-- ============================================================================
-- USER BUDGET COLUMNS
-- ============================================================================

-- Add daily and monthly budget columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS ai_daily_budget_usd DECIMAL(10, 2) DEFAULT 1.00;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS ai_monthly_budget_usd DECIMAL(10, 2) DEFAULT 10.00;

-- ============================================================================
-- BUDGET CHECK FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION check_ai_budget(
  p_user_id UUID,
  p_operation TEXT,
  p_estimated_cost DECIMAL
)
RETURNS BOOLEAN
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
-- HELPER FUNCTION: LOG AI USAGE
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
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own AI usage
CREATE POLICY "Users can view their own AI usage"
ON public.ai_usage_log
FOR SELECT
USING (user_id = (SELECT auth.uid()));

-- Only service role can insert AI usage logs
CREATE POLICY "Service role can insert AI usage logs"
ON public.ai_usage_log
FOR INSERT
TO service_role
WITH CHECK (true);

-- Service role has full access
CREATE POLICY "Service role has full access to ai_usage_log"
ON public.ai_usage_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.ai_usage_log IS 'Tracks AI API usage and costs per user for budget enforcement';
COMMENT ON COLUMN public.ai_usage_log.operation IS 'Type of AI operation (tier3, whisper, transcribe, lesson, etc.)';
COMMENT ON COLUMN public.ai_usage_log.model IS 'AI model used (gpt-4o, gpt-5, whisper-1, etc.)';
COMMENT ON COLUMN public.ai_usage_log.cost_usd IS 'Cost in USD with 6 decimal places for precision';

COMMENT ON COLUMN public.users.ai_daily_budget_usd IS 'Maximum AI spending per user per 24 hours';
COMMENT ON COLUMN public.users.ai_monthly_budget_usd IS 'Maximum AI spending per user per calendar month';

COMMENT ON FUNCTION check_ai_budget IS 'Checks if user is within daily/monthly AI budget before operation';
COMMENT ON FUNCTION log_ai_usage IS 'Helper function to log AI API usage with cost tracking';
