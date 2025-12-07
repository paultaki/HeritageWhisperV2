/**
 * Lazy-initialized OpenAI client
 * 
 * This module provides a lazily-initialized OpenAI client that avoids
 * build-time errors when OPENAI_API_KEY is not available.
 * 
 * USAGE:
 * import { getOpenAIClient } from "@/lib/openai";
 * 
 * // In your API route handler:
 * const openai = getOpenAIClient();
 * const completion = await openai.chat.completions.create({...});
 * 
 * @module lib/openai
 */

import "server-only";
import OpenAI from "openai";

let _openaiClient: OpenAI | null = null;

/**
 * Get the OpenAI client instance.
 * Uses lazy initialization to avoid build-time errors when OPENAI_API_KEY is not available.
 * The client is created once and reused for subsequent calls.
 * 
 * @returns OpenAI client instance
 * @throws Error if OPENAI_API_KEY is not set at runtime
 */
export function getOpenAIClient(): OpenAI {
  if (!_openaiClient) {
    _openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return _openaiClient;
}

/**
 * Re-export OpenAI type for convenience
 */
export type { OpenAI };
