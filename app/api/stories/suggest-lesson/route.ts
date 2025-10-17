import { NextRequest, NextResponse } from 'next/server';
import { chat } from '@/lib/ai/gatewayClient';
import { getModelConfig } from '@/lib/ai/modelConfig';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { story, title, year } = await req.json();

    if (!story) {
      return NextResponse.json(
        { error: 'Story text is required' },
        { status: 400 }
      );
    }

    // Use fast model for lesson suggestions (cost-effective)
    const modelConfig = getModelConfig('echo');

    const lessonPrompt = `You are helping someone reflect on a personal memory to find wisdom or lessons learned.

STORY:
${title ? `Title: ${title}\n` : ''}${story}
${year ? `\nYear: ${year}` : ''}

YOUR TASK:
Generate 3 different lesson/wisdom options they could add to this memory. Each should be:

1. **First-person**: Write as if THEY are saying it ("I learned...", "This taught me...")
2. **Authentic**: Match their voice and tone from the story
3. **Specific**: Tied to THIS specific memory, not generic wisdom
4. **Concise**: 20-35 words max per option
5. **Varied**: Give 3 DIFFERENT angles:
   - Option 1: Practical lesson (what they learned to do/not do)
   - Option 2: Emotional lesson (how they felt, grew emotionally)
   - Option 3: Character lesson (what it revealed about themselves or others)

Format your response as JSON with this structure:
{
  "practical": "I learned that...",
  "emotional": "This taught me...",
  "character": "I discovered..."
}

Return ONLY the JSON, no other text.`;

    const response = await chat({
      model: modelConfig.model,
      messages: [
        { role: 'system', content: 'You are an expert at helping people reflect on their life experiences and extract wisdom.' },
        { role: 'user', content: lessonPrompt },
      ],
      temperature: 0.8, // Higher for variety
      max_tokens: 300,
    });

    console.log('[Lesson Suggestion] Raw response:', response.text);

    // Parse JSON from response
    let lessons;
    try {
      // Try to extract JSON if wrapped in markdown or other text
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        lessons = JSON.parse(jsonMatch[0]);
      } else {
        lessons = JSON.parse(response.text);
      }
    } catch (parseError) {
      console.error('[Lesson Suggestion] Failed to parse JSON:', response.text);
      // Fallback to generic lessons
      lessons = {
        practical: "I learned that small moments often carry the biggest lessons.",
        emotional: "This memory reminds me to appreciate what matters most.",
        character: "I discovered something important about who I am and what I value.",
      };
    }

    console.log('[Lesson Suggestion] Parsed lessons:', lessons);

    return NextResponse.json({
      lessons,
      meta: {
        model: response.meta.modelUsed,
        latencyMs: response.meta.latencyMs,
      },
    });
  } catch (error) {
    console.error('[Lesson Suggestion] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate lesson suggestions' },
      { status: 500 }
    );
  }
}
