import React from "react";
import { Sparkles, Plus } from "lucide-react";
import { GhostPrompt } from "@/lib/ghostPrompts";

interface GhostPromptCardProps {
  prompt: GhostPrompt;
  onClick: () => void;
}

export function GhostPromptCard({ prompt, onClick }: GhostPromptCardProps) {
  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer transition-all duration-300 hover:scale-[1.02] animate-fadeIn opacity-60 hover:opacity-80"
      data-testid={`ghost-prompt-${prompt.id}`}
    >
      {/* Main Card */}
      <div className="relative p-4 backdrop-blur-sm rounded-lg border-2 border-dashed transition-colors"
        style={{
          borderColor: 'var(--color-timeline-card-border)',
          backgroundColor: 'rgba(224, 229, 237, 0.4)' // Low opacity version of badge bg #E0E5ED
        }}
      >
        {/* Sparkle Icon */}
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md opacity-90 group-hover:opacity-100 transition-opacity">
          <Sparkles className="w-4 h-4 text-heritage-coral animate-pulse" />
        </div>

        {/* Content */}
        <div className="space-y-2">
          {/* Year and Age */}
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <span className="font-medium">{prompt.year}</span>
            <span>•</span>
            <span>Age {prompt.age}</span>
            {prompt.icon && <span className="ml-auto">{prompt.icon}</span>}
          </div>

          {/* Title - Italic for ghost prompts */}
          <h3 className="font-medium text-sm line-clamp-1 italic group-hover:text-heritage-coral transition-colors"
            style={{ color: 'var(--hw-text-primary)' }}
          >
            {prompt.title}
          </h3>

          {/* Get Started Label */}
          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <Plus className="w-3 h-3" />
            <span className="italic font-medium">Get Started</span>
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
