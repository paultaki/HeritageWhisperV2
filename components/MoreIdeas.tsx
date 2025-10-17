'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ChevronDown, ChevronUp, Plus, Bookmark } from 'lucide-react';

type Prompt = {
  id: string;
  text: string;
  category: string;
  sensitivity?: 'low' | 'medium' | 'high';
};

const BASE_CATEGORIES = [
  'Advice',
  'Ancestry',
  'Celebrations',
  'Childhood',
  'Friends',
  'Parents',
  'Personality & Quirks',
  'Interests',
  'Travel',
  'Work & Career',
  'Songs & Music',
  'Sayings & Quotes',
  'Feelings',
  'Grandparents',
  'Historical',
  'Humor & Jokes',
  'Teen Years',
  'Other',
];

const SENSITIVE_CATEGORIES = [
  'Dating',
  'Health & Hard Times',
  'Spirituality & Faith',
  'Reflections & Legacy',
];

export default function MoreIdeas() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false); // Collapsed by default
  const [showSensitive, setShowSensitive] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showAllIdeas, setShowAllIdeas] = useState(false);

  const categories = [...BASE_CATEGORIES, ...(showSensitive ? SENSITIVE_CATEGORIES : [])];

  useEffect(() => {
    if (!category) return;
    setLoading(true);
    setShowAllIdeas(false); // Reset when category changes
    fetch(
      `/api/catalog/prompts?category=${encodeURIComponent(category)}&showSensitive=${showSensitive}`
    )
      .then((r) => r.json())
      .then((d) => setIdeas(d.prompts || []))
      .catch((err) => {
        console.error('Error fetching prompts:', err);
        setIdeas([]);
      })
      .finally(() => setLoading(false));
  }, [category, showSensitive]);

  async function queueNext(p: Prompt) {
    if (savingId) return; // Prevent double-clicks

    setSavingId(p.id);
    try {
      console.log('Queueing prompt:', p);
      const response = await apiRequest('POST', '/api/prompts/queue-next', {
        text: p.text,
        category: p.category,
      });
      const result = await response.json();
      console.log('Queue response:', result);

      // Refresh the prompts page data
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('refreshPrompts'));
      }

      toast({
        title: 'Added to queue',
        description: 'This prompt is now in your queue',
      });
    } catch (error) {
      console.error('Error queueing prompt:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add prompt. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingId(null);
    }
  }

  async function dismissPrompt(p: Prompt) {
    if (savingId) return; // Prevent double-clicks

    setSavingId(p.id);
    try {
      console.log('Dismissing prompt:', p);
      const response = await apiRequest('POST', '/api/prompts/dismiss', {
        source: 'catalog',
        text: p.text,
        category: p.category,
      });
      const result = await response.json();
      console.log('Dismiss response:', result);

      // Refresh the prompts page data
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('refreshPrompts'));
      }

      toast({
        title: 'Moved to archive',
        description: 'You can find this in your Prompt Archive',
      });
    } catch (error) {
      console.error('Error dismissing prompt:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to dismiss prompt. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingId(null);
    }
  }

  if (!session) return null;

  return (
    <section className="space-y-4">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 font-bold hover:opacity-80 transition-opacity w-full"
        style={{
          fontSize: "20px",
          color: "#000000",
          lineHeight: "1.4"
        }}
      >
        <span className="flex-1 text-left">More Ideas</span>
        {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {!open && (
        <p className="text-sm text-gray-600" style={{ opacity: 0.7 }}>
          Browse by category. Add any to your list.
        </p>
      )}

      {open && (
        <>
          {/* Controls */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600" style={{ opacity: 0.7 }}>
              Browse by category. Add any to your list.
            </p>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showSensitive}
                onChange={(e) => setShowSensitive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <span>Sensitive topics</span>
            </label>
          </div>

          {/* Category chips */}
          <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2">
            {categories.map((c) => (
              <Button
                key={c}
                onClick={() => setCategory(c)}
                variant={category === c ? 'default' : 'secondary'}
                className={`rounded-full text-sm h-9 px-4 ${
                  category === c
                    ? 'bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-600 hover:to-orange-500 text-white'
                    : 'bg-white/60 hover:bg-white/80 text-gray-700'
                }`}
              >
                {c}
              </Button>
            ))}
          </div>

          {/* Selected category prompts */}
          {category && (
            <div>
              {loading && (
                <p className="text-sm text-gray-500 italic">Loading prompts…</p>
              )}

              {!loading && ideas.length === 0 && (
                <p className="text-sm text-gray-500 italic">
                  No ideas available in this category.
                </p>
              )}

              {!loading && ideas.length > 0 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {(showAllIdeas ? ideas : ideas.slice(0, 3)).map((p, index) => (
                      <div
                        key={p.id}
                        className="bg-white border border-black/10 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col"
                        style={{
                          borderRadius: '8px',
                          minHeight: '200px',
                        }}
                      >
                        <div className="p-3 flex flex-col h-full justify-between gap-3">
                          {/* Prompt text */}
                          <div className="flex-1 flex items-start">
                            <p className="text-xl leading-relaxed text-gray-900">
                              {p.text}
                            </p>
                          </div>

                          {/* Action buttons */}
                          <div className="flex gap-2">
                            <Button
                              onClick={(e) => {
                                e.preventDefault();
                                queueNext(p);
                              }}
                              disabled={savingId === p.id}
                              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium shadow-sm transition-all duration-200 min-h-[48px] text-base whitespace-nowrap"
                              style={{ borderRadius: '6px' }}
                            >
                              {savingId === p.id ? (
                                <span className="animate-pulse">Adding...</span>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4 mr-1" />
                                  Add
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.preventDefault();
                                dismissPrompt(p);
                              }}
                              disabled={savingId === p.id}
                              variant="outline"
                              className="flex-1 text-base font-medium min-h-[48px] whitespace-nowrap"
                            >
                              {savingId === p.id ? (
                                <span className="animate-pulse">...</span>
                              ) : (
                                <>
                                  <Bookmark className="w-4 h-4 mr-1" />
                                  Dismiss
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {ideas.length > 3 && !showAllIdeas && (
                    <button
                      onClick={() => setShowAllIdeas(true)}
                      className="mt-4 text-base font-medium text-gray-700 hover:text-gray-900 underline"
                    >
                      Show {ideas.length - 3} more
                    </button>
                  )}
                  {showAllIdeas && ideas.length > 3 && (
                    <button
                      onClick={() => setShowAllIdeas(false)}
                      className="mt-4 text-base font-medium text-gray-700 hover:text-gray-900 underline"
                    >
                      Show less
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
