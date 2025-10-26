/**
 * Audio Manager
 *
 * Global audio playback singleton to ensure only one audio plays at a time.
 * Used by MemoryCard components in timeline and book views.
 *
 * Features:
 * - Singleton pattern for global state
 * - Listener registration for cards
 * - Automatic pause of other audio when new audio starts
 * - Clean cleanup on card unmount
 *
 * Created: January 25, 2025
 * Extracted from: TimelineMobile.tsx
 */

/**
 * AudioManager - Singleton class for managing audio playback across components
 *
 * Ensures only one audio element plays at a time by coordinating between
 * multiple MemoryCard components.
 */
export class AudioManager {
  private static instance: AudioManager;
  private currentAudio: HTMLAudioElement | null = null;
  private currentCardId: string | null = null;
  private listeners: Map<
    string,
    (playing: boolean, audioElement?: HTMLAudioElement | null) => void
  > = new Map();

  /**
   * Get singleton instance
   */
  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Register a card's audio state callback
   * @param cardId - Unique identifier for the card
   * @param callback - Function to call when audio state changes
   */
  register(
    cardId: string,
    callback: (
      playing: boolean,
      audioElement?: HTMLAudioElement | null,
    ) => void,
  ): void {
    this.listeners.set(cardId, callback);
  }

  /**
   * Unregister a card (cleanup on unmount)
   * @param cardId - Unique identifier for the card
   */
  unregister(cardId: string): void {
    if (this.currentCardId === cardId && this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
      this.currentCardId = null;
    }
    this.listeners.delete(cardId);
  }

  /**
   * Request to play audio for a card
   * Stops all other audio and notifies other cards
   * @param cardId - Unique identifier for the card requesting playback
   */
  requestPlay(cardId: string): void {
    // First, pause and reset any currently playing audio
    if (this.currentAudio && this.currentCardId !== cardId) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {
        console.error("Error pausing audio:", e);
      }
    }

    // Clear current references
    this.currentAudio = null;
    this.currentCardId = null;

    // Stop all other playing audio by notifying ALL other cards
    this.listeners.forEach((callback, id) => {
      if (id !== cardId) {
        callback(false, null);
      }
    });
  }

  /**
   * Confirm that audio is now playing for a card
   * Called after successful play() promise resolution
   * @param cardId - Unique identifier for the card
   * @param audio - The HTML audio element that's playing
   */
  confirmPlaying(cardId: string, audio: HTMLAudioElement): void {
    this.currentAudio = audio;
    this.currentCardId = cardId;
  }

  /**
   * Stop audio for a card
   * @param cardId - Unique identifier for the card
   */
  stop(cardId: string): void {
    if (this.currentCardId === cardId) {
      this.currentAudio = null;
      this.currentCardId = null;
    }
  }
}

/**
 * Singleton instance for global use
 */
export const audioManager = AudioManager.getInstance();
