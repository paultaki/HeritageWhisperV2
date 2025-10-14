import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { logger } from "@/lib/logger";
import { validatePromptQuality } from "@/lib/promptQuality";

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

    // Generate 3 contextual follow-up questions using GPT-4o-mini
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a thoughtful interviewer helping someone record their life story. 
          Generate EXACTLY 3 follow-up questions as a JSON array.
          
          Rules:
          - 15 words or less per question
          - Reference specific details they mentioned (names, places, emotions)
          - Keep them talking: ask about sensory details, moments, people
          - Conversational tone (not therapy-speak)
          - Open-ended questions (not yes/no)
          - Avoid generic phrases like "tell me more" or "how did that make you feel"
          
          Return ONLY a JSON object in this exact format:
          { "questions": ["Question 1?", "Question 2?", "Question 3?"] }
          
          No preamble, no explanation, just the JSON.`
        },
        {
          role: "user",
          content: `Original prompt: "${originalPrompt || "Tell me about yourself"}"
          
What they've said so far: "${transcript}"

Generate 3 follow-up questions as JSON:`
        }
      ],
      temperature: 0.8,
      max_tokens: 200,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content?.trim() || "{}";
    logger.info("[ContextualFollowUp] Raw GPT response:", { responseText });
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (error) {
      logger.error("[ContextualFollowUp] Failed to parse JSON response", { error, responseText });
      // Fallback to simple questions
      return NextResponse.json({
        questions: [
          "What happened next?",
          "How did that change things?",
          "Who else was there?"
        ],
        _meta: {
          model: completion.model,
          tokens: completion.usage?.total_tokens,
          fallback: true
        }
      });
    }

    const rawQuestions = parsedResponse.questions || [];
    
    // Validate each question with basic quality gates
    const validatedQuestions = rawQuestions
      .filter((q: string) => {
        if (!q || typeof q !== 'string') return false;
        
        const validation = validatePromptQuality(q);
        const wordCount = q.split(/\s+/).length;
        
        // Looser validation than full intimacy engine (20 words instead of 30)
        return validation.isValid && wordCount <= 20;
      })
      .slice(0, 3); // Max 3 questions

    // Ensure we have at least 2 questions
    const finalQuestions = validatedQuestions.length >= 2 
      ? validatedQuestions 
      : [
          "What happened next in that moment?",
          "How did that change things for you?",
          "Who else was part of that story?"
        ];

    logger.info("[ContextualFollowUp] Generated questions", {
      rawCount: rawQuestions.length,
      validatedCount: finalQuestions.length,
      questions: finalQuestions,
      model: completion.model,
      tokens: completion.usage?.total_tokens,
    });

    return NextResponse.json({ 
      questions: finalQuestions,
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

