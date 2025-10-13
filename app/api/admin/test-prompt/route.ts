/**
 * POST /api/admin/test-prompt
 * 
 * Tests a single prompt through quality gates and returns detailed validation results
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validatePromptQuality, scorePromptQuality } from "@/lib/promptQuality";
import { logger } from "@/lib/logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Generic words that fail validation
const GENERIC_WORDS = new Set([
  "girl",
  "boy",
  "man",
  "woman",
  "person",
  "people",
  "house",
  "home",
  "room",
  "chair",
  "table",
  "place",
  "thing",
  "stuff",
  "kid",
  "child",
  "guy",
  "lady",
  "someone",
  "something",
]);

// Banned phrases
const BANNED_PHRASES = [
  "tell me more",
  "what else",
  "how did that make you feel",
  "what's the clearest memory",
  "in your story about",
  "you mentioned in",
  "describe the",
  "can you tell me",
];

// Emotional depth signals
const EMOTIONAL_DEPTH_SIGNALS = [
  "felt",
  "realized",
  "learned",
  "taught",
  "changed",
  "chose",
  "decided",
  "traded",
  "lost",
  "gained",
  "never",
  "always",
  "first",
  "last",
];

export async function POST(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Verify the JWT token with Supabase
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 },
      );
    }

    // Parse request body
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 },
      );
    }

    // Run validation
    const isValid = validatePromptQuality(prompt);
    const score = scorePromptQuality(prompt);

    // Count words
    const wordCount = prompt.trim().split(/\s+/).filter(Boolean).length;

    // Detailed analysis
    const lower = prompt.toLowerCase();
    const issues: string[] = [];
    const warnings: string[] = [];
    const passedChecks: string[] = [];

    // Check word count
    if (wordCount > 30) {
      issues.push(`Too long: ${wordCount} words (30 max)`);
    } else if (wordCount > 25) {
      warnings.push(`Close to limit: ${wordCount} words (30 max)`);
    } else {
      passedChecks.push(`Concise: ${wordCount} words`);
    }

    // Check for generic words
    const foundGeneric: string[] = [];
    for (const word of GENERIC_WORDS) {
      if (lower.includes(word)) {
        foundGeneric.push(word);
      }
    }
    const hasGenericWords = foundGeneric.length > 0;
    if (hasGenericWords) {
      issues.push(`Contains generic words: ${foundGeneric.join(", ")}`);
    } else {
      passedChecks.push("No generic nouns");
    }

    // Check for banned phrases
    const foundBanned: string[] = [];
    for (const phrase of BANNED_PHRASES) {
      if (lower.includes(phrase)) {
        foundBanned.push(phrase);
      }
    }
    const hasBannedPhrases = foundBanned.length > 0;
    if (hasBannedPhrases) {
      issues.push(`Contains banned phrases: ${foundBanned.join(", ")}`);
    } else {
      passedChecks.push("No banned phrases");
    }

    // Check if it's a question
    const isQuestion = prompt.includes("?");
    if (!isQuestion) {
      warnings.push("Not a question (should end with ?)");
    } else {
      passedChecks.push("Is a question");
    }

    // Check for emotional depth signals
    const foundEmotional: string[] = [];
    for (const signal of EMOTIONAL_DEPTH_SIGNALS) {
      if (lower.includes(signal)) {
        foundEmotional.push(signal);
      }
    }
    const hasEmotionalDepth = foundEmotional.length > 0;
    if (hasEmotionalDepth) {
      passedChecks.push(`Emotional depth: ${foundEmotional.join(", ")}`);
    } else {
      warnings.push("No emotional depth signals");
    }

    // Check for exact phrases (quoted text)
    const hasExactPhrases = /['"]([^'"]+)['"]/.test(prompt);
    if (hasExactPhrases) {
      passedChecks.push("Uses exact phrases (proves listening)");
    }

    return NextResponse.json({
      success: true,
      result: {
        prompt,
        wordCount,
        isValid,
        score,
        issues,
        warnings,
        passedChecks,
        hasGenericWords,
        hasBannedPhrases,
        hasEmotionalDepth,
        hasExactPhrases,
        isQuestion,
      },
    });

  } catch (err) {
    logger.error("Error in POST /api/admin/test-prompt:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
