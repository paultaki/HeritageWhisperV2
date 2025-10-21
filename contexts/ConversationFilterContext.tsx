/**
 * Conversation Filter Context
 *
 * Manages client-side filtering for PEARLS v1.1 Witness system:
 * - Hint freshness tracking (≤1 hint every 2-3 turns)
 * - Do-not-ask topics filtering
 *
 * Updates Pearl's instructions dynamically via session.update.
 */

'use client';

import { createContext, useContext, useState, useRef, useCallback } from 'react';
import { HintFreshnessTracker } from '@/lib/hintFreshness';
import { DoNotAskFilter } from '@/lib/doNotAskFilter';

type ConversationFilterContextType = {
  hintTracker: HintFreshnessTracker;
  doNotAskFilter: DoNotAskFilter;
  recordHint: (hint: string, era?: string) => void;
  nextTurn: () => void;
  blockTopic: (topic: string) => void;
  unblockTopic: (topic: string) => void;
  getFilteredInstructions: (baseInstructions: string) => string;
  reset: () => void;
};

const ConversationFilterContext = createContext<ConversationFilterContextType | undefined>(undefined);

export function ConversationFilterProvider({ children }: { children: React.ReactNode }) {
  const hintTrackerRef = useRef(new HintFreshnessTracker());
  const doNotAskFilterRef = useRef(new DoNotAskFilter());
  const [, forceUpdate] = useState(0);

  const recordHint = useCallback((hint: string, era?: string) => {
    hintTrackerRef.current.recordHint(hint, era);
    forceUpdate(prev => prev + 1);
  }, []);

  const nextTurn = useCallback(() => {
    hintTrackerRef.current.nextTurn();
    forceUpdate(prev => prev + 1);
  }, []);

  const blockTopic = useCallback((topic: string) => {
    doNotAskFilterRef.current.blockTopic(topic);
    forceUpdate(prev => prev + 1);
  }, []);

  const unblockTopic = useCallback((topic: string) => {
    doNotAskFilterRef.current.unblockTopic(topic);
    forceUpdate(prev => prev + 1);
  }, []);

  const getFilteredInstructions = useCallback((baseInstructions: string): string => {
    let instructions = baseInstructions;

    // Add do-not-ask topics to instructions
    const blockedTopics = doNotAskFilterRef.current.getBlockedTopics();
    if (blockedTopics.length > 0) {
      instructions += `\n\nTOPICS TO AVOID: Do not ask about or reference these topics: ${blockedTopics.join(', ')}.`;
    }

    // Add hint freshness context
    const usageHistory = hintTrackerRef.current.getUsageHistory();
    if (usageHistory.length > 0) {
      const recentHints = usageHistory.slice(-3).map(h => h.hintText);
      instructions += `\n\nRECENT HINTS USED: You recently used these sensory prompts: ${recentHints.join(' | ')}. Use different angles now.`;
    }

    return instructions;
  }, []);

  const reset = useCallback(() => {
    hintTrackerRef.current.reset();
    doNotAskFilterRef.current.reset();
    forceUpdate(prev => prev + 1);
  }, []);

  const value: ConversationFilterContextType = {
    hintTracker: hintTrackerRef.current,
    doNotAskFilter: doNotAskFilterRef.current,
    recordHint,
    nextTurn,
    blockTopic,
    unblockTopic,
    getFilteredInstructions,
    reset,
  };

  return (
    <ConversationFilterContext.Provider value={value}>
      {children}
    </ConversationFilterContext.Provider>
  );
}

export function useConversationFilters() {
  const context = useContext(ConversationFilterContext);
  if (!context) {
    throw new Error('useConversationFilters must be used within ConversationFilterProvider');
  }
  return context;
}
