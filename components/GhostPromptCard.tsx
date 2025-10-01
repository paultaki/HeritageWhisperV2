import React from 'react';
import { Sparkles, Plus } from 'lucide-react';
import { GhostPrompt } from '@/lib/ghostPrompts';

interface GhostPromptCardProps {
  prompt: GhostPrompt;
  onClick: () => void;
}

export function GhostPromptCard({ prompt, onClick }: GhostPromptCardProps) {
  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer transition-all duration-300 hover:scale-[1.02] animate-fadeIn"
      data-testid={`ghost-prompt-${prompt.id}`}
    >
      {/* Main Card */}
      <div className="relative p-4 bg-white/85 backdrop-blur-sm rounded-lg border-2 border-dashed border-gray-300/60 hover:border-heritage-coral/40 transition-colors">
        {/* Sparkle Icon */}
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md opacity-90 group-hover:opacity-100 transition-opacity">
          <Sparkles className="w-4 h-4 text-heritage-coral animate-pulse" />
        </div>

        {/* Content */}
        <div className="space-y-2">
          {/* Year and Age */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="font-medium">{prompt.year}</span>
            <span>•</span>
            <span>Age {prompt.age}</span>
            {prompt.icon && <span className="ml-auto">{prompt.icon}</span>}
          </div>

          {/* Title */}
          <h3 className="font-medium text-gray-800 text-sm line-clamp-1 group-hover:text-heritage-coral transition-colors">
            {prompt.title}
          </h3>

          {/* Suggested Memory Label */}
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Plus className="w-3 h-3" />
            <span className="italic">Suggested memory - Click to record</span>
          </div>
        </div>

        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-heritage-coral/5 to-heritage-orange/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>

      {/* Subtle pulse animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}