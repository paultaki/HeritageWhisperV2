import { NextRequest, NextResponse } from 'next/server';
import { chat } from '@/lib/ai/gatewayClient';
import { getModelConfig } from '@/lib/ai/modelConfig';
import { toSeverity } from '@/lib/typesafe';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for GPT-5 processing

export async function POST(req: NextRequest) {
  try {
    const { story, title, year, currentWordCount } = await req.json();

    if (!story) {
      return NextResponse.json(
        { error: 'Story text is required' },
        { status: 400 }
      );
    }

    // Use GPT-5 with medium reasoning effort for story enhancement
    const modelConfig = getModelConfig('whisper'); // Use whisper config which has medium effort

    // Calculate target word count based on current length
    let targetWords = 220; // Default to 2 pages
    if (currentWordCount > 250) {
      targetWords = 450; // Aim for 3 pages max
    }

    // Craft the enhancement prompt
    const enhancementPrompt = `You are an expert storyteller helping someone enhance their personal memory for a printed family heritage book.

ORIGINAL STORY:
${story}

STORY METADATA:
${title ? `Title: ${title}` : ''}
${year ? `Year: ${year}` : ''}
Current word count: ${currentWordCount} words

YOUR TASK:
Rewrite this memory to be more compelling, captivating, and vivid while:

1. **Preserve the facts**: Do NOT invent new facts, people, or events that weren't in the original. Stay true to what happened.
2. **Match the tone**: Understand if this is humorous, serious, reflective, sad, angry, nostalgic, etc. Write in the SAME emotional tone.
3. **Match their voice**: Write as if the author is telling it. Keep their personality and style.
4. **Bring it to life**: Add sensory details, emotional depth, and visual imagery that COULD have been there based on the context.
5. **Fill in gaps naturally**: If something is implied but not explicit, you may describe it (e.g., "the summer heat" if it's July, "the smell of pine" if in a forest).
6. **Target length**: Aim for ${targetWords} words (±20). This will fit nicely in a ${targetWords === 220 ? '2' : '3'}-page spread in the printed book.
7. **Use short paragraphs**: Break the story into 3-5 short, punchy paragraphs. Each paragraph should be 2-4 sentences max.
8. **Conversational**: Write like someone telling a story over coffee, not a formal essay.

WHAT NOT TO DO:
- Don't add new characters that weren't mentioned
- Don't invent dialogue unless implied
- Don't change the core event or outcome
- Don't make it flowery or overly poetic
- Don't add a moral or lesson (that's handled separately)

Return ONLY the enhanced story text, nothing else. No preamble, no explanation.`;

    console.log('[Story Enhancement] Sending to GPT-5:', {
      model: modelConfig.model,
      reasoning_effort: modelConfig.reasoning_effort,
      originalWordCount: currentWordCount,
      targetWordCount: targetWords,
    });

    const response = await chat({
      model: modelConfig.model,
      messages: [
        { role: 'system', content: 'You are an expert at enhancing personal stories for heritage books while preserving authenticity and voice.' },
        { role: 'user', content: enhancementPrompt },
      ],
      reasoning_effort: toSeverity(modelConfig.reasoning_effort),
      temperature: 0.7, // Slightly higher for creativity
      max_tokens: 1500,
    });

    console.log('[Story Enhancement] Response received:', {
      enhancedWordCount: response.text.split(' ').filter(w => w.length > 0).length,
      latency: response.meta.latencyMs,
      cost: response.meta.costUsd,
    });

    return NextResponse.json({
      enhancedStory: response.text,
      meta: {
        originalWordCount: currentWordCount,
        enhancedWordCount: response.text.split(' ').filter(w => w.length > 0).length,
        targetWordCount: targetWords,
        model: response.meta.modelUsed,
        latencyMs: response.meta.latencyMs,
        costUsd: response.meta.costUsd,
      },
    });
  } catch (error) {
    console.error('[Story Enhancement] Error:', error);
    return NextResponse.json(
      { error: 'Failed to enhance story' },
      { status: 500 }
    );
  }
}
