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
  source: 'ai' | 'catalog' | 'family';
  category?: string;
  anchorEntity?: string;
  anchorYear?: number;
  variant: 'queue' | 'personalized' | 'archived' | 'family';
  index?: number;
  submittedBy?: {
    id: string;
    name: string;
    email?: string;
    relationship?: string;
  };
  onRecord: (id: string, text: string, source: 'ai' | 'catalog' | 'family') => void;
  onQueue?: (id: string, text: string, source: 'ai' | 'catalog' | 'family', category?: string) => void;
  onDismiss: (id: string, text: string, source: 'ai' | 'catalog' | 'family', category?: string) => void;
  onDelete: (id: string, source: 'ai' | 'catalog' | 'family') => void;
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
  submittedBy,
  onRecord,
  onQueue,
  onDismiss,
  onDelete,
  isLoading = false,
}: PromptCardProps) {
  const isArchived = variant === 'archived';
  const isQueued = variant === 'queue';
  const isPersonalized = variant === 'personalized';
  const isFamily = variant === 'family';

  return (
    <Card
      className={`group ${
        isFamily
          ? 'bg-gradient-to-br from-blue-50/80 to-indigo-50/40 border-2 border-blue-200/70 hover:border-blue-300/90'
          : 'bg-gradient-to-br from-white to-gray-50/30 border border-gray-200/60 hover:border-gray-300/80'
      } shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col relative overflow-hidden`}
      style={{
        borderRadius: '12px',
      }}
    >
      {/* Subtle top accent bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-[3px] ${
          isFamily
            ? 'bg-gradient-to-r from-blue-400/70 via-indigo-400/60 to-purple-400/70'
            : 'bg-gradient-to-r from-amber-400/60 via-orange-400/50 to-rose-400/60'
        } opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      />

      <CardContent className="p-5 flex flex-col h-full justify-between gap-4">
        {/* Submitter name for family prompts */}
        {isFamily && submittedBy && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-300/60">
              💙 Question from {submittedBy.name}
              {submittedBy.relationship && ` • ${submittedBy.relationship}`}
            </span>
          </div>
        )}

        {/* Metadata badge - elegant and subtle */}
        {contextNote && !isArchived && !isFamily && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/50">
              {contextNote}
            </span>
          </div>
        )}

        {/* Prompt text - more elegant typography */}
        <div className="flex-1 flex items-start">
          <p className="text-[20px] leading-[1.6] text-gray-800 font-normal tracking-[-0.011em]">
            {promptText}
          </p>
        </div>

        {/* Actions */}
        {!isArchived && (
          <div className="flex items-center gap-2.5 pt-2">
            {/* Primary Record button - styled based on variant */}
            <Button
              onClick={() => onRecord(id, promptText, source)}
              disabled={isLoading}
              className={`flex-1 ${
                isFamily
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                  : 'bg-gray-900 hover:bg-gray-800'
              } text-white font-medium shadow-sm hover:shadow-md transition-all duration-200 min-h-[44px] text-[15px] whitespace-nowrap group/btn`}
              style={{ borderRadius: '8px' }}
            >
              <Mic className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform duration-200" />
              {isFamily ? 'Answer' : 'Record'}
            </Button>

            {/* Overflow menu for Queue and Dismiss */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  disabled={isLoading}
                  className="w-[44px] h-[44px] p-0 hover:bg-gray-100 flex-shrink-0 border border-gray-200 hover:border-gray-300 transition-all duration-200"
                  aria-label="More options"
                  style={{ borderRadius: '8px' }}
                >
                  <MoreVertical className="w-4.5 h-4.5 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48" style={{ borderRadius: '10px' }}>
                {/* Queue option - only for personalized */}
                {isPersonalized && onQueue && (
                  <DropdownMenuItem
                    onClick={() => onQueue(id, promptText, source, category)}
                    disabled={isLoading}
                    className="cursor-pointer text-[15px] py-2.5"
                  >
                    <Plus className="w-4 h-4 mr-2.5 text-gray-600" />
                    Add to Queue
                  </DropdownMenuItem>
                )}
                {/* Dismiss option */}
                <DropdownMenuItem
                  onClick={() => onDismiss(id, promptText, source, category)}
                  disabled={isLoading}
                  className="cursor-pointer text-[15px] py-2.5"
                >
                  <Archive className="w-4 h-4 mr-2.5 text-gray-600" />
                  Dismiss
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Archive actions - horizontal layout */}
        {isArchived && (
          <div className="flex items-center gap-2.5 pt-2">
            {onQueue && (
              <Button
                onClick={() => onQueue(id, promptText, source, category)}
                disabled={isLoading}
                className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200 min-h-[44px] text-[15px]"
                style={{ borderRadius: '8px' }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Back
              </Button>
            )}
            <Button
              onClick={() => onDelete(id, source)}
              disabled={isLoading}
              variant="outline"
              className="flex-1 text-[15px] font-medium min-h-[44px] border-gray-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all duration-200"
              style={{ borderRadius: '8px' }}
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
