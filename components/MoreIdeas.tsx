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
  const [open, setOpen] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const categories = [...BASE_CATEGORIES, ...(showSensitive ? SENSITIVE_CATEGORIES : [])];

  useEffect(() => {
    if (!category) return;
    setLoading(true);
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

      toast({
        title: result.promoted ? 'Queued to Ready to Tell' : 'Added to Saved for later',
        description: result.promoted
          ? 'Your prompt is now in your inbox'
          : 'Max 3 ready at a time. Check Saved for later.',
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
        className="flex items-center gap-2 text-xl font-serif font-semibold text-heritage-brown hover:text-amber-700 transition-colors w-full"
      >
        <span className="text-amber-600">💡</span>
        <span className="flex-1 text-left">More ideas</span>
        {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {!open && (
        <p className="text-sm text-gray-500 pl-8">
          Browse by category. Add any to your list.
        </p>
      )}

      {open && (
        <>
          {/* Controls */}
          <div className="flex items-center justify-between pl-8">
            <p className="text-sm text-gray-600">
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
          <div className="flex flex-wrap gap-2 pl-8">
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
            <div className="pl-8">
              {loading && (
                <p className="text-sm text-gray-500 italic">Loading prompts…</p>
              )}

              {!loading && ideas.length === 0 && (
                <p className="text-sm text-gray-500 italic">
                  No ideas available in this category.
                </p>
              )}

              {!loading && ideas.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {ideas.map((p, index) => (
                    <div
                      key={p.id}
                      className="bg-white/30 backdrop-blur-md border border-white/40 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:bg-white/40 flex flex-col"
                      style={{
                        minHeight: '280px',
                      }}
                    >
                      <div className="p-4 flex flex-col h-full justify-between">
                        {/* Prompt text - centered vertically */}
                        <div className="flex-1 flex items-center justify-center mb-3">
                          <p 
                            className="text-base md:text-lg font-serif text-gray-800 leading-relaxed text-center"
                            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                          >
                            {p.text}
                          </p>
                        </div>

                        {/* Action buttons stacked */}
                        <div className="space-y-2">
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              queueNext(p);
                            }}
                            disabled={savingId === p.id}
                            className="w-full bg-gradient-to-r from-amber-500 via-orange-400 to-rose-400 hover:from-amber-600 hover:via-orange-500 hover:to-rose-500 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 text-sm h-9 disabled:opacity-50"
                          >
                            {savingId === p.id ? (
                              <span className="animate-pulse">Saving...</span>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-1" />
                                Queue
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
                            className="w-full bg-white/60 hover:bg-white/80 border-amber-200 hover:border-amber-300 text-gray-700 text-sm h-9 disabled:opacity-50"
                          >
                            {savingId === p.id ? (
                              <span className="animate-pulse">Dismissing...</span>
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
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
