'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Mic, MoreVertical, Plus, Archive, Trash2 } from 'lucide-react';

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

  return (
    <Card
      className="bg-white border border-black/10 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col relative"
      style={{
        borderRadius: '8px',
      }}
    >
      <CardContent className="p-3 flex flex-col h-full justify-between gap-3">
        {/* Metadata badge - smaller and subtle */}
        {contextNote && !isArchived && (
          <p className="text-sm text-gray-600" style={{ opacity: 0.7 }}>
            {contextNote}
          </p>
        )}

        {/* Prompt text */}
        <div className="flex-1 flex items-start">
          <p className="text-xl leading-relaxed text-gray-900">
            {promptText}
          </p>
        </div>

        {/* Actions */}
        {!isArchived && (
          <div className="flex items-center gap-2">
            {/* Primary Record button */}
            <Button
              onClick={() => onRecord(id, promptText, source)}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium shadow-sm transition-all duration-200 min-h-[48px] text-base whitespace-nowrap"
              style={{ borderRadius: '6px' }}
            >
              <Mic className="w-4 h-4 mr-1.5" />
              Record
            </Button>

            {/* Overflow menu for Queue and Dismiss */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  disabled={isLoading}
                  className="w-[48px] h-[48px] p-0 hover:bg-gray-100 flex-shrink-0"
                  aria-label="More options"
                >
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {/* Queue option - only for personalized */}
                {isPersonalized && onQueue && (
                  <DropdownMenuItem
                    onClick={() => onQueue(id, promptText, source, category)}
                    disabled={isLoading}
                    className="cursor-pointer text-base"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Queue
                  </DropdownMenuItem>
                )}
                {/* Dismiss option */}
                <DropdownMenuItem
                  onClick={() => onDismiss(id, promptText, source, category)}
                  disabled={isLoading}
                  className="cursor-pointer text-base"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Dismiss
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Archive actions - horizontal layout */}
        {isArchived && (
          <div className="flex items-center gap-2">
            {onQueue && (
              <Button
                onClick={() => onQueue(id, promptText, source, category)}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium shadow-sm transition-all duration-200 min-h-[48px] text-base"
                style={{ borderRadius: '6px' }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            )}
            <Button
              onClick={() => onDelete(id, source)}
              disabled={isLoading}
              variant="outline"
              className="flex-1 text-base font-medium min-h-[48px] hover:bg-red-50 hover:text-red-700 hover:border-red-300"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
