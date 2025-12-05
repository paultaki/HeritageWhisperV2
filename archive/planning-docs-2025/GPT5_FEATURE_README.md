# GPT-5 Tier-3 and Whisper Upgrades

## Overview

This feature upgrades HeritageWhisper to use GPT-5 for deeper synthesis in Tier-3 milestone analysis and Whisper generation, while maintaining fast performance for Tier-1 and Echo prompts.

## Architecture

### Model Routing

- **Tier-1 Templates**: `gpt-4o-mini` (fast, no reasoning)
- **Echo Prompts**: `gpt-4o-mini` (fast, no reasoning)
- **Tier-3 Milestones**: `gpt-5` with adjustable reasoning effort (when enabled)
- **Whispers**: `gpt-5` at medium effort (when enabled)

### Reasoning Effort Mapping

Tier-3 analysis adjusts reasoning effort based on milestone depth:

- **Stories 1-9**: `low` effort (basic pattern recognition)
- **Stories 10-49**: `medium` effort (pattern synthesis)
- **Stories 50+**: `high` effort (deep character insights)

## Environment Variables

Add these to your `.env.local` file:

```bash
# ============================================================================
# Vercel AI Gateway Configuration
# ============================================================================

# Gateway Base URL (default: https://ai-gateway.vercel.sh/v1)
VERCEL_AI_GATEWAY_BASE_URL=https://ai-gateway.vercel.sh/v1

# Gateway API Key (required)
VERCEL_AI_GATEWAY_API_KEY=your_vercel_ai_gateway_key

# Alternative: Direct OpenAI API (fallback)
OPENAI_API_KEY=your_openai_api_key

# ============================================================================
# AI Model Configuration (GPT-5 Feature Flags)
# ============================================================================

# Fast model for Tier-1 and Echo prompts (default: gpt-4o-mini)
NEXT_PUBLIC_FAST_MODEL_ID=gpt-4o-mini

# GPT-5 model ID (default: gpt-5)
NEXT_PUBLIC_GPT5_MODEL_ID=gpt-5

# Enable GPT-5 for Tier-3 milestone analysis with reasoning effort
# Set to "true" to use GPT-5 with adjustable effort (low/medium/high)
# Set to "false" to use fast model (gpt-4o-mini)
NEXT_PUBLIC_GPT5_TIER3_ENABLED=true

# Enable GPT-5 for Whisper generation at medium effort
# Set to "true" to use GPT-5 at medium effort
# Set to "false" to use fast model (gpt-4o-mini)
NEXT_PUBLIC_GPT5_WHISPERS_ENABLED=true
```

## File Structure

```
lib/ai/
├── modelConfig.ts        # Model selection and effort mapping
└── gatewayClient.ts      # Gateway client with telemetry

lib/
├── tier3AnalysisV2.ts    # Updated to use GPT-5 via Gateway
├── whisperGeneration.ts  # Updated to use GPT-5 via Gateway
└── echoPrompts.ts        # Updated to use Gateway (fast model)

app/api/
└── stories/route.ts      # Added telemetry logging

tests/ai/
├── routing.spec.ts       # Model routing tests
└── gatewayClient.spec.ts # Gateway client tests
```

## Feature Flags

### Enable GPT-5 for Tier-3

```bash
NEXT_PUBLIC_GPT5_TIER3_ENABLED=true
```

When enabled:
- Tier-3 milestone analysis uses `gpt-5`
- Reasoning effort adjusts by milestone: low (1-9) → medium (10-49) → high (50+)
- Telemetry logs TTFT, latency, cost, and reasoning tokens

When disabled:
- Tier-3 uses `gpt-4o-mini` (fast model)
- No reasoning effort parameter
- Standard telemetry only

### Enable GPT-5 for Whispers

```bash
NEXT_PUBLIC_GPT5_WHISPERS_ENABLED=true
```

When enabled:
- Whisper generation uses `gpt-5` at medium effort
- Better emotional synthesis and implicit meaning detection

When disabled:
- Whispers use `gpt-4o-mini` (fast model)
- Faster generation, lower cost

## Telemetry

All AI calls now log comprehensive telemetry:

```typescript
{
  op: "ai_call",
  stage: "tier3" | "whisper" | "echo",
  milestone?: number,
  model: "gpt-5" | "gpt-4o-mini",
  effort: "low" | "medium" | "high" | "n/a",
  ttftMs: 150,              // Time to first token
  latencyMs: 2500,          // Total latency
  costUsd: 0.0234,          // Cost in USD
  tokensUsed: {
    input: 1500,
    output: 450,
    reasoning: 2800,        // GPT-5 only
    total: 4750
  }
}
```

Monitor these in your Gateway dashboard or application logs.

## Testing

### Run Tests

```bash
# Run all AI routing tests
npm test tests/ai/routing.spec.ts

# Run gateway client tests
npm test tests/ai/gatewayClient.spec.ts

# Run all tests
npm test
```

### Expected Results

✅ Effort mapping: 3→low, 10→medium, 50→high  
✅ Tier-1/Echo always use fast model  
✅ Tier-3/Whispers respect feature flags  
✅ Gateway connection successful  
✅ Telemetry structure valid  

## Smoke Test Checklist

- [ ] **Flags true**: Tier-3 runs on GPT-5 with milestone-based effort; Whispers on GPT-5 medium
- [ ] **Flags false**: Everything uses fast model; no effort param
- [ ] **Gateway dashboard**: Shows TTFT and cost for Tier-3 and Whispers
- [ ] **Quality gates**: No regressions to prompt quality validation
- [ ] **Skip/retire**: Prompt skip and retirement logic unchanged
- [ ] **Story-3 paywall**: 1 unlocked + 3 locked prompts as expected

## Cost Implications

### GPT-5 Pricing (Estimated)

Tier-3 analysis costs depend on story count and reasoning effort:

- **Story 3 (low)**: ~$0.02 per analysis
- **Story 10 (medium)**: ~$0.05 per analysis
- **Story 50 (high)**: ~$0.15 per analysis

Whispers (medium effort):
- **Per whisper**: ~$0.01

### Monthly Costs (1,000 active users)

Assuming average 10 stories/user/month:

| Component | Model | Cost per Call | Calls/Month | Monthly Cost |
|-----------|-------|---------------|-------------|--------------|
| Tier-1 | gpt-4o-mini | $0.0001 | 10,000 | $1.00 |
| Echo | gpt-4o-mini | $0.0001 | 10,000 | $1.00 |
| Whispers | gpt-5 (med) | $0.01 | 1,000 | $10.00 |
| Tier-3 | gpt-5 (var) | $0.02-0.15 | 2,000 | $40-120 |
| **Total** | | | | **$52-132** |

Compare to baseline (all gpt-4o-mini): ~$15/month

**Cost increase**: 3.5-9x, but with significantly better prompt quality and user engagement.

## Rollback Plan

If GPT-5 causes issues, immediately disable:

```bash
NEXT_PUBLIC_GPT5_TIER3_ENABLED=false
NEXT_PUBLIC_GPT5_WHISPERS_ENABLED=false
```

System will automatically fall back to fast model (gpt-4o-mini) for all operations.

## Monitoring

Watch these metrics:

1. **Tier-3 latency**: Should be 2-5s for low effort, 5-10s for high effort
2. **Prompt quality scores**: Should maintain ≥70 average
3. **Story 3 conversion**: Target ≥45% (baseline: 35-40%)
4. **Cost per user**: Track in Gateway dashboard
5. **Error rates**: GPT-5 should have <1% error rate

## Vercel AI Gateway Dashboard

Access telemetry at: https://vercel.com/dashboard/ai-gateway

Key views:
- **Model Usage**: See gpt-5 vs gpt-4o-mini distribution
- **Cost Breakdown**: Track spending by model/operation
- **Latency P50/P95**: Monitor response times
- **Error Rates**: Track failed requests

## Troubleshooting

### GPT-5 not being used

Check:
1. `NEXT_PUBLIC_GPT5_TIER3_ENABLED=true` is set
2. Gateway API key is valid
3. GPT-5 access is enabled in your OpenAI account
4. Check logs for model selection: `[Tier 3 V2] Calling gpt-5...`

### High latency

- High effort at Story 50+ can take 10-15s (expected)
- Consider reducing effort threshold in `effortForMilestone()`
- Monitor `ttftMs` vs `latencyMs` in logs

### Costs too high

- Disable Whispers first: `NEXT_PUBLIC_GPT5_WHISPERS_ENABLED=false`
- Reduce Tier-3 frequency by adjusting milestones
- Lower effort thresholds (e.g., high only at 100+)

### Quality regressions

- GPT-5 prompts still pass through quality gates
- Check `[Tier 3 V2] REJECTED prompt` logs
- If rejection rate >30%, review system prompts

## Support

For issues or questions:
1. Check Gateway dashboard for error details
2. Review application logs for telemetry
3. Test with flags disabled to isolate issue
4. Check Vercel AI Gateway status page

## References

- [OpenAI GPT-5 Documentation](https://platform.openai.com/docs/guides/reasoning)
- [Vercel AI Gateway Docs](https://vercel.com/docs/ai-gateway)
- [HeritageWhisper AI Prompt System](./AI_PROMPT_SYSTEM_IMPLEMENTATION.md)

