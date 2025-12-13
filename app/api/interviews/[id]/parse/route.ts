/**
 * Interview Parse API
 * 
 * POST /api/interviews/[id]/parse - Parse interview into distinct stories using OpenAI
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

// SECURITY: Use centralized admin client (enforces server-only via import)
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for story parsing
const STORY_PARSING_PROMPT = `You are an expert editor and biographer analyzing a life story interview transcript.

INPUT: A transcript with timestamped messages between PEARL (interviewer) and USER (storyteller).

YOUR TASK:
1. Identify distinct stories/memories (typically 2-5 per 15-minute interview)
2. Each story should have: what happened, who was involved, where/when (if mentioned), emotional content
3. Don't force splits—if it's genuinely one continuous story, return one story

FOR EACH STORY, PROVIDE:
- recommendedTitle: A warm, descriptive title (not generic like "Story 1")
- bridgedText: The user's words with Pearl's questions REMOVED, but add 3-5 bridge words where questions were to smooth the narrative
  - Example: Pearl asked "How did that make you feel?" 
  - Bridge: "How did that make me feel? Well, it was..."
  - Keep the user's voice; just smooth transitions
- rawTranscript: The original user words without modifications
- messageIds: Array of message IDs that belong to this story
- startTimestamp: ISO timestamp of first message in this story
- endTimestamp: ISO timestamp of last message in this story
- suggestedYear: If user mentioned when this happened (null if not mentioned)
- suggestedAge: If user mentioned their age (null if not mentioned)
- lifePhase: childhood | teen | early_adult | mid_adult | late_adult | senior
- wisdomSuggestion: One sentence capturing the lesson or meaning (user can edit)
- peopleMentioned: Names of people in the story
- placesMentioned: Locations mentioned

ALSO PROVIDE fullInterview:
- formattedTranscript: The complete conversation with speaker labels (PEARL: / USER_NAME:)
- totalDurationSeconds: Total duration from transcript

RULES:
- Stories should feel complete, not arbitrarily chopped
- If a topic spans multiple Q&A exchanges, keep them together
- Look for natural topic transitions as story boundaries
- Minimum story length: ~30 seconds of user speaking
- Maximum stories: 6 (combine smaller related memories if needed)
- For timestamps, use the message timestamps from the input

OUTPUT FORMAT: JSON object with this structure:
{
  "parsedStories": [...],
  "fullInterview": {
    "formattedTranscript": "...",
    "totalDurationSeconds": number
  },
  "metadata": {
    "totalStoriesFound": number,
    "processedAt": "ISO timestamp"
  }
}`;

interface TranscriptMessage {
  id: string;
  type: string;
  content: string;
  timestamp: string;
  sender: 'hw' | 'user';
  audioDuration?: number;
}

interface ParsedStory {
  id: string;
  recommendedTitle: string;
  bridgedText: string;
  rawTranscript: string;
  messageIds: string[];
  startTimestamp: string;
  endTimestamp: string;
  durationSeconds: number;
  suggestedYear?: number;
  suggestedAge?: number;
  lifePhase?: string;
  wisdomSuggestion?: string;
  peopleMentioned?: string[];
  placesMentioned?: string[];
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Validate session
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // 2. Fetch interview
    const { data: interview, error: fetchError } = await supabaseAdmin
      .from('interviews')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !interview) {
      return NextResponse.json(
        { error: 'Interview not found' },
        { status: 404 }
      );
    }

    // 3. Get user name for transcript formatting
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single();
    
    const userName = userData?.name || 'User';

    // 4. Prepare transcript for OpenAI
    const transcriptMessages = interview.transcript_json as TranscriptMessage[];
    
    if (!transcriptMessages || transcriptMessages.length === 0) {
      return NextResponse.json(
        { error: 'No transcript found in interview' },
        { status: 400 }
      );
    }

    // Format transcript with timestamps for OpenAI
    const formattedForAI = transcriptMessages.map(m => ({
      id: m.id,
      speaker: m.sender === 'hw' ? 'PEARL' : userName.toUpperCase(),
      content: m.content,
      timestamp: m.timestamp,
      audioDuration: m.audioDuration || null,
    }));

    // 5. Call OpenAI to parse stories
    logger.info('[Parse API] Calling OpenAI to parse stories for interview:', id);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: STORY_PARSING_PROMPT },
        { 
          role: 'user', 
          content: `Here is the interview transcript to analyze. The storyteller's name is "${userName}".\n\nMessages:\n${JSON.stringify(formattedForAI, null, 2)}` 
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower temperature for more consistent parsing
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    logger.info('[Parse API] OpenAI returned', parsed.parsedStories?.length || 0, 'stories');

    // 6. Add unique IDs and calculate durations for each story
    const storiesWithIds = (parsed.parsedStories || []).map((story: any) => {
      // Calculate duration from timestamps
      let durationSeconds = 0;
      if (story.startTimestamp && story.endTimestamp) {
        const start = new Date(story.startTimestamp).getTime();
        const end = new Date(story.endTimestamp).getTime();
        durationSeconds = Math.round((end - start) / 1000);
      }

      return {
        ...story,
        id: uuidv4(),
        durationSeconds: durationSeconds > 0 ? durationSeconds : 60, // Default to 60s if calculation fails
      } as ParsedStory;
    });

    // 7. Build final result
    const detectedStories = {
      parsedStories: storiesWithIds,
      fullInterview: {
        formattedTranscript: parsed.fullInterview?.formattedTranscript || 
          transcriptMessages.map(m => 
            `${m.sender === 'hw' ? 'PEARL' : userName.toUpperCase()}: ${m.content}`
          ).join('\n\n'),
        totalDurationSeconds: interview.duration_seconds,
      },
      metadata: {
        totalStoriesFound: storiesWithIds.length,
        processedAt: new Date().toISOString(),
      },
    };

    // 8. Update interview with parsed results
    const { error: updateError } = await supabaseAdmin
      .from('interviews')
      .update({
        detected_stories: detectedStories,
        stories_parsed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      logger.error('[Parse API] Failed to update interview:', updateError);
      return NextResponse.json(
        { error: 'Failed to save parsed stories' },
        { status: 500 }
      );
    }

    logger.info('[Parse API] Successfully parsed interview:', id);

    return NextResponse.json({
      success: true,
      detectedStories,
    });
  } catch (err) {
    logger.error('[Parse API] Error:', err);
    return NextResponse.json(
      { error: 'Failed to parse interview' },
      { status: 500 }
    );
  }
}
