// Navigation cache for reliable data transfer between pages
// Uses both memory cache (fast) and localStorage (persistent) as fallback

interface QAPair {
  question: string;
  answer: string;
  timestamp?: string;
  duration?: number;
}

interface NavPayload {
  transcription?: string;
  wisdomTranscription?: string;
  audioDuration?: number;
  wisdomDuration?: number;
  timestamp?: number | string;
  audioUrl?: string;
  prompt?: {
    title: string;
    text: string;
    decade?: string;
  };
  mainAudioBase64?: string;
  mainAudioType?: string;
  wisdomClipBase64?: string;
  wisdomClipType?: string;
  wisdomAudioBase64?: string;
  wisdomAudioType?: string;
  returnToReview?: boolean;
  title?: string;
  storyYear?: string;
  storyDate?: string;
  selectedEmotions?: string[];
  photoUrl?: string;
  photoTransform?: { zoom: number; position: { x: number; y: number } } | null;
  wisdomClipText?: string;

  // Wizard mode fields
  mode?: 'conversation' | 'quick';
  audioBlob?: Blob;
  duration?: number;
  rawTranscript?: string;
  qaPairs?: QAPair[];
  enhancedTranscript?: string;
  lessonOptions?: any;
  lessonLearned?: string;
  formattedContent?: any;
  useEnhanced?: boolean;
  selectedTranscript?: string;
  photos?: Array<{
    id?: string;
    url: string;
    isHero?: boolean;
    transform?: { zoom: number; position: { x: number; y: number } };
  }>;

  // Re-recording fields
  isReRecording?: boolean;
  storyId?: string;
  returnToEdit?: boolean;
  returnPath?: string;
}

// In-memory cache for speed
const memoryCache = new Map<string, NavPayload>();

export const navCache = {
  // Store data with a unique ID
  async set(id: string, payload: NavPayload): Promise<void> {
    try {
      // Store in memory for immediate access (with Blob)
      memoryCache.set(id, payload);

      // For localStorage, we need to serialize Blobs
      const serializable = { ...payload };

      // Convert Blob to base64 for localStorage
      if (payload.audioBlob) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(payload.audioBlob!);
        });

        const base64 = await base64Promise;
        (serializable as any)._audioBlobBase64 = base64;
        delete (serializable as any).audioBlob;
      }

      // Try to store in localStorage as backup (may fail if quota exceeded)
      try {
        localStorage.setItem(`nav:${id}`, JSON.stringify(serializable));
      } catch (storageError: any) {
        if (storageError.name !== 'QuotaExceededError') {
          throw storageError;
        }
        // Memory cache still works, just skip localStorage backup
      }
    } catch (error) {
      console.error("NavCache: Error storing data", error);
      // Even if localStorage fails, memory cache should still work
    }
  },

  // Retrieve data by ID
  get(id: string): NavPayload | null {
    if (!id) return null;

    try {
      // Try memory cache first (fastest, has Blob intact)
      const memoryData = memoryCache.get(id);
      if (memoryData) {
        return memoryData;
      }

      // Fallback to localStorage
      const localData = localStorage.getItem(`nav:${id}`);
      if (localData) {
        const parsed = JSON.parse(localData);

        // Convert base64 back to Blob if present
        if ((parsed as any)._audioBlobBase64) {
          const base64 = (parsed as any)._audioBlobBase64;
          // Extract data from data URL (data:audio/webm;base64,...)
          const match = base64.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            const mimeType = match[1];
            const base64Data = match[2];
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            parsed.audioBlob = new Blob([bytes], { type: mimeType });
          }
          delete (parsed as any)._audioBlobBase64;
        }

        // Refresh memory cache
        memoryCache.set(id, parsed);
        return parsed;
      }

      return null;
    } catch (error) {
      console.error("NavCache: Error retrieving data", error);
      return null;
    }
  },

  // Retrieve and remove data (consume once)
  consume(id: string): NavPayload | null {
    if (!id) return null;

    const data = this.get(id);
    if (data) {
      // Clean up after consumption
      this.remove(id);
    }
    return data;
  },

  // Remove data from both caches
  remove(id: string): void {
    try {
      memoryCache.delete(id);
      localStorage.removeItem(`nav:${id}`);
    } catch (error) {
      console.error("NavCache: Error removing data", error);
    }
  },

  // Generate a unique ID for navigation
  generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Store data and return the ID (convenience method)
  store(payload: NavPayload): string {
    const id = this.generateId();
    // Fire and forget - don't await to maintain sync API
    this.set(id, payload).catch(err => {
      console.error('NavCache: Error in async store:', err);
    });
    return id;
  },

  // Retrieve data (alias for get)
  retrieve(id: string): NavPayload | null {
    return this.get(id);
  },

  // Clean up old entries from localStorage (older than 1 hour)
  cleanupOldEntries(): void {
    try {
      const now = Date.now();
      const maxAge = 60 * 60 * 1000; // 1 hour in milliseconds
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('nav:')) {
          // Extract timestamp from key (format: nav:TIMESTAMP-RANDOM)
          const match = key.match(/^nav:(\d+)-/);
          if (match) {
            const timestamp = parseInt(match[1], 10);
            if (now - timestamp > maxAge) {
              keysToRemove.push(key);
            }
          }
        }
      }

      // Remove old entries
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error("NavCache: Error cleaning up old entries", error);
    }
  },
};

// Clean up old entries on module load
if (typeof window !== 'undefined') {
  navCache.cleanupOldEntries();
}
