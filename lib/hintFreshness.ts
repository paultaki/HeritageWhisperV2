/**
 * Hint Freshness Tracker for PEARLS v1.1 Witness System
 *
 * Prevents hint repetition and enforces sensory-first progression:
 * - Max 1 hint every 2-3 turns
 * - No duplicate hints within session
 * - No duplicate hints within same era (childhood, teens, etc.)
 *
 * Used in client-side filtering before presenting hints to user.
 */

export type HintUsage = {
  hintText: string;
  turnNumber: number;
  era?: string; // e.g., "childhood", "teens", "adulthood"
  timestamp: number;
};

export class HintFreshnessTracker {
  private usageHistory: HintUsage[] = [];
  private currentTurn: number = 0;

  /**
   * Record that a hint was used
   */
  recordHint(hintText: string, era?: string): void {
    this.usageHistory.push({
      hintText,
      turnNumber: this.currentTurn,
      era,
      timestamp: Date.now(),
    });
  }

  /**
   * Advance to next turn (call after each user response)
   */
  nextTurn(): void {
    this.currentTurn++;
  }

  /**
   * Check if hint can be used (passes freshness rules)
   */
  canUseHint(hintText: string, era?: string): boolean {
    // Rule 1: No duplicates within session
    if (this.usageHistory.some(h => h.hintText === hintText)) {
      console.log('[HintFreshness] ❌ Hint already used in session:', hintText);
      return false;
    }

    // Rule 2: No duplicates within same era
    if (era && this.usageHistory.some(h => h.hintText === hintText && h.era === era)) {
      console.log('[HintFreshness] ❌ Hint already used in era', era, ':', hintText);
      return false;
    }

    // Rule 3: Max 1 hint every 2-3 turns
    const recentHints = this.usageHistory.filter(
      h => this.currentTurn - h.turnNumber <= 3
    );

    if (recentHints.length >= 1) {
      const lastHint = recentHints[recentHints.length - 1];
      const turnsSince = this.currentTurn - lastHint.turnNumber;
      console.log('[HintFreshness] ❌ Too soon for another hint (last hint', turnsSince, 'turns ago)');
      return false;
    }

    return true;
  }

  /**
   * Get all used hints
   */
  getUsageHistory(): readonly HintUsage[] {
    return Object.freeze([...this.usageHistory]);
  }

  /**
   * Reset tracker (start new session)
   */
  reset(): void {
    this.usageHistory = [];
    this.currentTurn = 0;
  }

  /**
   * Get current turn number
   */
  getCurrentTurn(): number {
    return this.currentTurn;
  }
}
