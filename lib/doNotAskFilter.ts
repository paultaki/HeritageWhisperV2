/**
 * Do-Not-Ask Topics Filter for PEARLS v1.1 Witness System
 *
 * Allows users to block specific topics/keywords from appearing in prompts.
 * Examples: "religion", "politics", "ex-spouse name", etc.
 *
 * Used in client-side filtering before presenting prompts to user.
 */

export class DoNotAskFilter {
  private blockedTopics: Set<string> = new Set();

  /**
   * Add a topic to the block list
   */
  blockTopic(topic: string): void {
    const normalized = topic.toLowerCase().trim();
    if (normalized.length > 0) {
      this.blockedTopics.add(normalized);
      console.log('[DoNotAsk] Blocked topic:', normalized);
    }
  }

  /**
   * Remove a topic from the block list
   */
  unblockTopic(topic: string): void {
    const normalized = topic.toLowerCase().trim();
    this.blockedTopics.delete(normalized);
    console.log('[DoNotAsk] Unblocked topic:', normalized);
  }

  /**
   * Check if a prompt contains any blocked topics
   */
  containsBlockedTopic(promptText: string): boolean {
    const normalized = promptText.toLowerCase();

    for (const topic of this.blockedTopics) {
      // Simple word boundary check
      const regex = new RegExp(`\\b${this.escapeRegex(topic)}\\b`, 'i');
      if (regex.test(normalized)) {
        console.log('[DoNotAsk] ❌ Prompt contains blocked topic "' + topic + '":', promptText);
        return true;
      }
    }

    return false;
  }

  /**
   * Filter array of prompts, removing those with blocked topics
   */
  filterPrompts(prompts: string[]): string[] {
    return prompts.filter(prompt => !this.containsBlockedTopic(prompt));
  }

  /**
   * Get all blocked topics
   */
  getBlockedTopics(): readonly string[] {
    return Object.freeze([...this.blockedTopics]);
  }

  /**
   * Reset filter (clear all blocked topics)
   */
  reset(): void {
    this.blockedTopics.clear();
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
