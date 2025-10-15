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
    try {
      const response = await apiRequest('POST', '/api/prompts/queue-next', {
        text: p.text,
        category: p.category,
      });
      const { promoted } = await response.json();

      toast({
        title: promoted ? 'Queued to Ready to Tell' : 'Added to Saved for later',
        description: promoted
          ? 'Your prompt is now in your inbox'
          : 'Max 3 ready at a time. Check Saved for later.',
      });
    } catch (error) {
      console.error('Error queueing prompt:', error);
      toast({
        title: 'Error',
        description: 'Failed to add prompt. Please try again.',
        variant: 'destructive',
      });
    }
  }

  async function saveForLater(p: Prompt) {
    try {
      await apiRequest('POST', '/api/prompts/save', {
        text: p.text,
        category: p.category,
      });

      toast({
        title: 'Saved for later',
        description: 'You can find this in your Saved for later section',
      });
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast({
        title: 'Error',
        description: 'Failed to save prompt. Please try again.',
        variant: 'destructive',
      });
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
            <div className="pl-8 space-y-3">
              {loading && (
                <p className="text-sm text-gray-500 italic">Loading prompts…</p>
              )}

              {!loading && ideas.length === 0 && (
                <p className="text-sm text-gray-500 italic">
                  No ideas available in this category.
                </p>
              )}

              {!loading && ideas.length > 0 && (
                <ul className="space-y-3">
                  {ideas.map((p) => (
                    <li
                      key={p.id}
                      className="rounded-xl border border-amber-200/50 p-5 bg-gradient-to-br from-amber-50/40 to-orange-50/40 hover:border-amber-300/70 transition-all duration-200"
                    >
                      <p className="text-base font-serif text-gray-800 leading-relaxed mb-4">
                        {p.text}
                      </p>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => queueNext(p)}
                          className="bg-gradient-to-r from-amber-500 via-orange-400 to-rose-400 hover:from-amber-600 hover:via-orange-500 hover:to-rose-500 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 text-sm h-10"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Queue next
                        </Button>
                        <Button
                          onClick={() => saveForLater(p)}
                          variant="outline"
                          className="bg-white/60 hover:bg-white/80 border-amber-200 hover:border-amber-300 text-gray-700 text-sm h-10"
                        >
                          <Bookmark className="w-4 h-4 mr-1" />
                          Save for later
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
