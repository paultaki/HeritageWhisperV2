// Navigation cache for reliable data transfer between pages
// Uses both memory cache (fast) and localStorage (persistent) as fallback

interface NavPayload {
  transcription?: string;
  wisdomTranscription?: string;
  audioDuration?: number;
  wisdomDuration?: number;
  timestamp?: number;
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
}

// In-memory cache for speed
const memoryCache = new Map<string, NavPayload>();

export const navCache = {
  // Store data with a unique ID
  set(id: string, payload: NavPayload): void {
    try {
      // Store in memory for immediate access
      memoryCache.set(id, payload);
      
      // Store in localStorage as backup
      localStorage.setItem(`nav:${id}`, JSON.stringify(payload));
      
      console.log('NavCache: Stored data with ID', id, payload);
    } catch (error) {
      console.error('NavCache: Error storing data', error);
    }
  },

  // Retrieve data by ID
  get(id: string): NavPayload | null {
    if (!id) return null;

    try {
      // Try memory cache first (fastest)
      const memoryData = memoryCache.get(id);
      if (memoryData) {
        console.log('NavCache: Retrieved from memory', id);
        return memoryData;
      }

      // Fallback to localStorage
      const localData = localStorage.getItem(`nav:${id}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        // Refresh memory cache
        memoryCache.set(id, parsed);
        console.log('NavCache: Retrieved from localStorage', id);
        return parsed;
      }

      console.log('NavCache: No data found for ID', id);
      return null;
    } catch (error) {
      console.error('NavCache: Error retrieving data', error);
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
      console.log('NavCache: Removed data for ID', id);
    } catch (error) {
      console.error('NavCache: Error removing data', error);
    }
  },

  // Generate a unique ID for navigation
  generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Store data and return the ID (convenience method)
  store(payload: NavPayload): string {
    const id = this.generateId();
    this.set(id, payload);
    return id;
  },

  // Retrieve data (alias for get)
  retrieve(id: string): NavPayload | null {
    return this.get(id);
  }
};