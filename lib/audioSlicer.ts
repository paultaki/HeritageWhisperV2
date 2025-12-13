/**
 * Audio Slicer Utilities
 * 
 * Helper functions for calculating story time ranges and slicing audio
 */

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
  messageIds: string[];
  startTimestamp: string;
  endTimestamp: string;
}

interface TimeRange {
  storyId: string;
  startMs: number;
  endMs: number;
  durationMs: number;
}

/**
 * Calculate time ranges for each story based on message timestamps
 * 
 * @param messages - Array of transcript messages with timestamps
 * @param parsedStories - Array of parsed stories with message IDs
 * @param interviewStartTime - ISO timestamp of when the interview started (optional)
 * @returns Array of time ranges for each story
 */
export function calculateStoryTimeRanges(
  messages: TranscriptMessage[],
  parsedStories: ParsedStory[],
  interviewStartTime?: string
): TimeRange[] {
  const baseTime = interviewStartTime 
    ? new Date(interviewStartTime).getTime()
    : messages.length > 0 
      ? new Date(messages[0].timestamp).getTime()
      : Date.now();

  const timeRanges: TimeRange[] = [];

  for (const story of parsedStories) {
    // Find messages that belong to this story
    const storyMessages = messages.filter(m => story.messageIds.includes(m.id));
    
    if (storyMessages.length === 0) {
      // Fallback to using story's own timestamps
      const startMs = new Date(story.startTimestamp).getTime() - baseTime;
      const endMs = new Date(story.endTimestamp).getTime() - baseTime;
      
      timeRanges.push({
        storyId: story.id,
        startMs: Math.max(0, startMs),
        endMs: Math.max(startMs + 1000, endMs), // At least 1 second
        durationMs: Math.max(1000, endMs - startMs),
      });
      continue;
    }

    // Get first and last message timestamps
    const sortedMessages = storyMessages.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    const firstMessage = sortedMessages[0];
    const lastMessage = sortedMessages[sortedMessages.length - 1];

    const startMs = new Date(firstMessage.timestamp).getTime() - baseTime;
    let endMs = new Date(lastMessage.timestamp).getTime() - baseTime;
    
    // Add estimated duration of last message if available
    if (lastMessage.audioDuration) {
      endMs += lastMessage.audioDuration * 1000;
    } else {
      // Estimate based on word count (~150 words per minute)
      const wordCount = lastMessage.content.split(/\s+/).length;
      const estimatedDurationMs = (wordCount / 150) * 60 * 1000;
      endMs += Math.max(5000, estimatedDurationMs); // At least 5 seconds
    }

    timeRanges.push({
      storyId: story.id,
      startMs: Math.max(0, startMs),
      endMs: endMs,
      durationMs: endMs - startMs,
    });
  }

  return timeRanges;
}

/**
 * Format time ranges for the audio split API
 * 
 * @param timeRanges - Array of time ranges
 * @returns Array formatted for /api/process-audio/split
 */
export function formatForSplitAPI(timeRanges: TimeRange[]): Array<{
  start: number;
  end: number;
  index: number;
}> {
  return timeRanges.map((range, index) => ({
    start: Math.round(range.startMs / 1000), // Convert to seconds
    end: Math.round(range.endMs / 1000),
    index,
  }));
}

/**
 * Slice audio via API endpoint
 * 
 * @param audioUrl - URL of the audio file to slice
 * @param timeRanges - Array of time ranges for each story
 * @param authToken - Authentication token
 * @returns Array of sliced audio URLs
 */
export async function sliceAudioForStories(
  audioUrl: string,
  timeRanges: TimeRange[],
  authToken: string
): Promise<Array<{ storyId: string; audioUrl: string; durationSeconds: number }>> {
  try {
    // Fetch the audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error('Failed to fetch audio file');
    }
    const audioBlob = await audioResponse.blob();

    // Prepare segments for split API
    const segments = formatForSplitAPI(timeRanges);

    // Call the split API
    const formData = new FormData();
    formData.append('audio', audioBlob, 'interview.webm');
    formData.append('segments', JSON.stringify(segments));

    const splitResponse = await fetch('/api/process-audio/split', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData,
    });

    if (!splitResponse.ok) {
      throw new Error('Audio splitting failed');
    }

    const { files } = await splitResponse.json();

    // Map results back to stories
    return timeRanges.map((range, index) => {
      const file = files.find((f: any) => f.index === index);
      return {
        storyId: range.storyId,
        audioUrl: file?.url || audioUrl, // Fallback to full audio
        durationSeconds: file?.duration || Math.round(range.durationMs / 1000),
      };
    });
  } catch (error) {
    console.error('[AudioSlicer] Error slicing audio:', error);
    // Return original audio URL for all stories as fallback
    return timeRanges.map(range => ({
      storyId: range.storyId,
      audioUrl: audioUrl,
      durationSeconds: Math.round(range.durationMs / 1000),
    }));
  }
}

/**
 * Get life phase from age
 */
export function getLifePhaseFromAge(age: number): string {
  if (age < 13) return 'childhood';
  if (age < 20) return 'teen';
  if (age < 35) return 'early_adult';
  if (age < 55) return 'mid_adult';
  if (age < 70) return 'late_adult';
  return 'senior';
}

/**
 * Format life phase for display
 */
export function formatLifePhase(phase: string): string {
  const labels: Record<string, string> = {
    childhood: 'Childhood (0-12)',
    teen: 'Teenage Years (13-19)',
    early_adult: 'Young Adult (20-34)',
    mid_adult: 'Middle Years (35-54)',
    late_adult: 'Later Adult (55-69)',
    senior: 'Senior Years (70+)',
  };
  return labels[phase] || phase;
}

/**
 * Format duration for display (e.g., "3:24")
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
