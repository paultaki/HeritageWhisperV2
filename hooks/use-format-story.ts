import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/config';

interface FormattedStory {
  fullText: string;
  paragraphs: string[];
  leftPage: string;
  rightPage: string;
  splitIndex: number;
}

export function useFormatStory(transcription: string | null | undefined, title?: string) {
  const [formattedStory, setFormattedStory] = useState<FormattedStory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transcription || transcription.length < 50) {
      // Don't format very short texts
      setFormattedStory(null);
      return;
    }

    // Check if the text already looks formatted (has paragraph breaks)
    const paragraphCount = (transcription.match(/\n\n/g) || []).length;
    if (paragraphCount >= 2) {
      // Text is already formatted, just use it as-is with a simple split
      const midpoint = Math.floor(transcription.length * 0.4);
      const paragraphs = transcription.split(/\n\n+/).filter(p => p.trim());

      // Find the best paragraph break for splitting
      let splitPoint = 0;
      let accumulatedLength = 0;
      for (let i = 0; i < paragraphs.length; i++) {
        accumulatedLength += paragraphs[i].length;
        if (accumulatedLength >= midpoint) {
          splitPoint = i;
          break;
        }
      }

      const leftPage = paragraphs.slice(0, Math.max(1, splitPoint)).join('\n\n');
      const rightPage = paragraphs.slice(splitPoint).join('\n\n');

      setFormattedStory({
        fullText: transcription,
        paragraphs,
        leftPage,
        rightPage,
        splitIndex: splitPoint
      });
      return;
    }

    const formatStory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(getApiUrl('/api/format-story'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            transcription,
            title: title || 'Personal Memory'
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to format story: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.formatted) {
          setFormattedStory(data.formatted);
        } else {
          // Fallback to simple split
          const midpoint = Math.floor(transcription.length * 0.4);
          const spaceIndex = transcription.indexOf(' ', midpoint);
          const splitPoint = spaceIndex > -1 ? spaceIndex : midpoint;

          setFormattedStory({
            fullText: transcription,
            paragraphs: [transcription],
            leftPage: transcription.substring(0, splitPoint).trim(),
            rightPage: transcription.substring(splitPoint).trim(),
            splitIndex: 0
          });
        }
      } catch (err) {
        console.error('Error formatting story:', err);
        setError(err instanceof Error ? err.message : 'Failed to format story');

        // Fallback to simple split on error
        const midpoint = Math.floor(transcription.length * 0.4);
        const spaceIndex = transcription.indexOf(' ', midpoint);
        const splitPoint = spaceIndex > -1 ? spaceIndex : midpoint;

        setFormattedStory({
          fullText: transcription,
          paragraphs: [transcription],
          leftPage: transcription.substring(0, splitPoint).trim(),
          rightPage: transcription.substring(splitPoint).trim(),
          splitIndex: 0
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the API call
    const timer = setTimeout(formatStory, 500);
    return () => clearTimeout(timer);
  }, [transcription, title]);

  return { formattedStory, isLoading, error };
}