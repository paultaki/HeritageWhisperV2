/**
 * Vercel AI Gateway Client
 * 
 * Provides unified OpenAI client with Gateway support, telemetry extraction,
 * and GPT-5 reasoning effort handling.
 */

import OpenAI from "openai";

// Gateway configuration
const baseURL = process.env.VERCEL_AI_GATEWAY_BASE_URL || process.env.AI_GATEWAY_BASE_URL || "https://ai-gateway.vercel.sh/v1";
const apiKey = process.env.VERCEL_AI_GATEWAY_API_KEY || process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY;

// In test environments, allow a dummy key so unit tests don't fail on missing secrets
if (!apiKey) {
  if (process.env.NODE_ENV === 'test') {
    process.env.OPENAI_API_KEY = 'test-key';
  } else {
    throw new Error("Missing AI API key. Set VERCEL_AI_GATEWAY_API_KEY, AI_GATEWAY_API_KEY, or OPENAI_API_KEY");
  }
}

// Initialize OpenAI client with Gateway
// PRODUCTION OPTIMIZATION: Added timeout (60s) and retry logic (3 attempts) to prevent hangs
export const gateway = new OpenAI({
  apiKey: process.env.VERCEL_AI_GATEWAY_API_KEY || process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY!,
  baseURL,
  timeout: 60000,  // 60 seconds - prevents indefinite hangs on slow/unresponsive API
  maxRetries: 3,   // Retry up to 3 times on 500/502/503/504 errors with exponential backoff
});

export interface ChatRequest {
  model: string;
  messages: Array<{ 
    role: "system" | "user" | "assistant"; 
    content: string;
  }>;
  reasoning_effort?: "low" | "medium" | "high";
  temperature?: number;
  max_tokens?: number;
}

export interface ChatResponse {
  text: string;
  meta: {
    ttftMs: number;          // Time to first token (from Gateway headers)
    latencyMs: number;        // Total request latency
    costUsd: number;          // Cost in USD (from Gateway headers)
    modelUsed: string;        // Model that handled the request
    reasoningEffort: string;  // Reasoning effort used (or "n/a")
    tokensUsed?: {
      input: number;
      output: number;
      reasoning?: number;     // Reasoning tokens for GPT-5
      total: number;
    };
  };
}

/**
 * Call OpenAI chat completions via Gateway with telemetry
 * 
 * @param request - Chat completion request
 * @returns Response with text and metadata
 */
export async function chat(request: ChatRequest): Promise<ChatResponse> {
  const start = Date.now();
  
  try {
    const completion = await gateway.chat.completions.create({
      model: request.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.2,
      max_tokens: request.max_tokens,
      ...(request.reasoning_effort && {
        // @ts-ignore - GPT-5 reasoning parameter (not in types yet)
        reasoning: { effort: request.reasoning_effort },
      }),
    });

    const text = completion.choices?.[0]?.message?.content ?? "";
    
    // Extract Gateway telemetry headers (if available)
    // Note: Headers may not be available in all Gateway configurations
    const headers = (completion as any).headers || {};
    const ttftMs = Number(headers["x-vercel-ai-ttft-ms"] || headers["x-ttft-ms"] || 0);
    const costUsd = Number(headers["x-vercel-ai-cost-usd"] || headers["x-cost-usd"] || 0);
    
    // Extract token usage
    const usage = completion.usage;
    const tokensUsed = usage ? {
      input: usage.prompt_tokens || 0,
      output: usage.completion_tokens || 0,
      reasoning: (usage as any).output_tokens_details?.reasoning_tokens,
      total: usage.total_tokens || 0,
    } : undefined;

    return {
      text,
      meta: {
        ttftMs,
        latencyMs: Date.now() - start,
        costUsd,
        modelUsed: request.model,
        reasoningEffort: request.reasoning_effort ?? "n/a",
        tokensUsed,
      },
    };
  } catch (error) {
    console.error("[Gateway Client] Chat completion failed:", error);
    throw error;
  }
}

/**
 * Test Gateway connection
 * Returns true if Gateway is accessible
 */
export async function testGatewayConnection(): Promise<boolean> {
  try {
    await gateway.models.list();
    return true;
  } catch (error) {
    console.error("[Gateway Client] Connection test failed:", error);
    return false;
  }
}

