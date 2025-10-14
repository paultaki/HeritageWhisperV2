import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { logger } from "@/lib/logger";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { transcript, originalPrompt } = await request.json();

    if (!transcript) {
      logger.error("[ContextualFollowUp] No transcript provided");
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      );
    }

    logger.info("[ContextualFollowUp] Generating follow-up question", {
      transcriptLength: transcript.length,
      hasOriginalPrompt: !!originalPrompt,
    });

    // Generate contextual follow-up using GPT-4o-mini
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a thoughtful interviewer helping someone record their life story. 
          Generate ONE follow-up question that:
          - Builds on what they just shared
          - Encourages deeper reflection or specific details
          - Feels natural and conversational
          - Is open-ended (not yes/no)
          - Is 15 words or less
          - Focuses on emotions, specific moments, or sensory details
          
          Return ONLY the question, no preamble or explanation.`
        },
        {
          role: "user",
          content: `Original prompt: "${originalPrompt || "Tell me about yourself"}"
          
What they've said so far: "${transcript}"

Generate a follow-up question:`
        }
      ],
      temperature: 0.8,
      max_tokens: 100,
    });

    const question = completion.choices[0]?.message?.content?.trim() || 
                    "Can you tell me more about that moment?";

    logger.info("[ContextualFollowUp] Generated question", {
      question,
      model: completion.model,
      tokens: completion.usage?.total_tokens,
    });

    return NextResponse.json({ 
      question,
      _meta: {
        model: completion.model,
        tokens: completion.usage?.total_tokens,
      }
    });
  } catch (error) {
    logger.error("[ContextualFollowUp] Error generating follow-up", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { error: "Failed to generate follow-up question" },
      { status: 500 }
    );
  }
}

