'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, Bookmark, Trash2, Star, Plus } from 'lucide-react';

interface PromptCardProps {
  id: string;
  promptText: string;
  contextNote?: string | null;
  source: 'ai' | 'catalog';
  category?: string;
  anchorEntity?: string;
  anchorYear?: number;
  variant: 'queue' | 'personalized' | 'archived';
  index?: number;
  onRecord: (id: string, text: string, source: 'ai' | 'catalog') => void;
  onQueue?: (id: string, text: string, source: 'ai' | 'catalog', category?: string) => void;
  onDismiss: (id: string, text: string, source: 'ai' | 'catalog', category?: string) => void;
  onDelete: (id: string, source: 'ai' | 'catalog') => void;
  isLoading?: boolean;
}

export default function PromptCard({
  id,
  promptText,
  contextNote,
  source,
  category,
  anchorEntity,
  anchorYear,
  variant,
  index = 0,
  onRecord,
  onQueue,
  onDismiss,
  onDelete,
  isLoading = false,
}: PromptCardProps) {
  const isArchived = variant === 'archived';
  const isQueued = variant === 'queue';
  const isPersonalized = variant === 'personalized';

  // Determine min height based on variant
  const minHeight = isArchived
    ? 'min-h-[160px]'
    : 'min-h-[280px] lg:min-h-[320px]';

  // Determine text size based on variant
  const textSize = isArchived
    ? 'text-base md:text-lg'
    : 'text-lg md:text-xl lg:text-2xl';

  // Determine padding based on variant
  const padding = isArchived
    ? 'p-3 md:p-4'
    : 'p-4 md:p-6 lg:p-8';

  return (
    <Card
      className={`bg-white/20 backdrop-blur-md border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:bg-white/25 flex flex-col ${minHeight} relative`}
      style={{
        animation: `slideInUp 0.8s ease-in-out ${index * 0.15}s forwards`,
        opacity: 0,
      }}
    >
      <CardContent className={`${padding} flex flex-col h-full justify-between`}>
        {/* Star icon for archived AI prompts */}
        {isArchived && source === 'ai' && (
          <div className="absolute top-2 right-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
        )}

        {/* Header badge */}
        <div className="flex items-center gap-1 text-xs md:text-sm text-amber-600 mb-3">
          {source === 'ai' ? (
            <>
              <span>✨</span>
              <span className="font-medium">Inspired by your memories</span>
            </>
          ) : (
            <>
              <span>💡</span>
              <span className="font-medium">{category || 'More Ideas'}</span>
            </>
          )}
        </div>

        {/* Context note for personalized prompts */}
        {contextNote && !isArchived && (
          <p className="text-xs text-gray-600 mb-2 italic">
            {contextNote}
          </p>
        )}

        {/* Prompt text - centered vertically */}
        <div className="flex-1 flex items-center justify-center mb-3 md:mb-4">
          <p
            className={`${textSize} font-serif text-gray-800 leading-relaxed drop-shadow-sm text-center`}
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {promptText}
          </p>
        </div>

        {/* Action buttons */}
        {!isArchived && (
          <div className="space-y-2">
            {/* Record button - always shown for queue and personalized */}
            {(isQueued || isPersonalized) && (
              <Button
                onClick={() => onRecord(id, promptText, source)}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-500 via-orange-400 to-rose-400 hover:from-amber-600 hover:via-orange-500 hover:to-rose-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-sm md:text-base py-2 md:py-3"
              >
                <Mic className="w-4 h-4 md:w-5 md:h-5 mr-1" />
                Record
              </Button>
            )}

            {/* Secondary buttons row */}
            <div className="grid grid-cols-2 gap-2">
              {/* Queue button - only for personalized */}
              {isPersonalized && onQueue && (
                <Button
                  onClick={() => onQueue(id, promptText, source, category)}
                  disabled={isLoading}
                  variant="outline"
                  className="bg-white/40 backdrop-blur-sm border-white/50 hover:bg-white/60 transition-all duration-300 text-sm md:text-base py-2 md:py-3"
                >
                  <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  Queue
                </Button>
              )}

              {/* Dismiss button */}
              <Button
                onClick={() => onDismiss(id, promptText, source, category)}
                disabled={isLoading}
                variant="outline"
                className={`bg-white/40 backdrop-blur-sm border-white/50 hover:bg-white/60 transition-all duration-300 text-sm md:text-base py-2 md:py-3 ${isPersonalized ? '' : 'col-span-2'}`}
              >
                <Bookmark className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Archive buttons - horizontal layout */}
        {isArchived && (
          <div className="grid grid-cols-2 gap-2">
            {onQueue && (
              <Button
                onClick={() => onQueue(id, promptText, source, category)}
                disabled={isLoading}
                variant="outline"
                className="bg-white/40 backdrop-blur-sm border-white/50 hover:bg-white/60 transition-all duration-300 text-sm py-2"
              >
                <Plus className="w-3 h-3 mr-1" />
                Queue
              </Button>
            )}
            <Button
              onClick={() => onDelete(id, source)}
              disabled={isLoading}
              variant="outline"
              className="bg-white/40 backdrop-blur-sm border-white/50 hover:bg-red-100 hover:border-red-300 hover:text-red-700 transition-all duration-300 text-sm py-2"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
