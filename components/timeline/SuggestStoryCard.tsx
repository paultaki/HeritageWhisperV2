/**
 * SuggestStoryCard Component
 *
 * A card at the end of the timeline for family viewers to suggest story topics.
 * Matches the AddMemoryCard styling but invites them to submit a question
 * for the storyteller instead of creating a memory.
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquarePlus, X, Loader2 } from "lucide-react";

type SuggestStoryCardProps = {
  storytellerId: string;
  storytellerName: string;
  isDark?: boolean;
};

export function SuggestStoryCard({
  storytellerId,
  storytellerName,
  isDark = false
}: SuggestStoryCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Scroll-in animation using IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.2, rootMargin: "100px 0px" }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleClick = () => {
    setDialogOpen(true);

    // Analytics
    if (typeof window !== "undefined" && (window as any).track) {
      (window as any).track("suggest_story_card_clicked", {
        location: "timeline_end",
        storytellerId,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (question.trim().length < 10) {
      alert("Please write at least 10 characters");
      return;
    }

    if (question.length > 500) {
      alert("Please keep it under 500 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/family/prompts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storytellerUserId: storytellerId,
          promptText: question,
          context: context || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit question");
      }

      // Success
      setDialogOpen(false);
      setQuestion("");
      setContext("");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error: any) {
      alert(error.message || "Failed to submit question");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get first name for display
  const firstName = storytellerName.split(" ")[0];

  return (
    <>
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-md">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-green-900">Question sent!</p>
              <p className="text-sm text-green-700 mt-1">
                {firstName} will see it in their prompt library.
              </p>
            </div>
            <button
              onClick={() => setShowSuccess(false)}
              className="flex-shrink-0 text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Card */}
      <div
        ref={cardRef}
        role="button"
        tabIndex={0}
        aria-label={`Suggest a story for ${storytellerName}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          max-w-full md:max-w-[448px] w-full
          bg-white rounded-2xl cursor-pointer
          transition-all duration-500
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
        `}
        style={{
          border: "1.5px dashed var(--color-timeline-card-border)",
          opacity: isHovered ? 1 : 0.85,
          boxShadow: isHovered
            ? "0 8px 20px rgba(0, 0, 0, 0.12)"
            : "0 4px 12px rgba(0, 0, 0, 0.08)",
          transform: isHovered ? "translateY(-2px)" : "translateY(0)",
        }}
      >
        {/* Icon Area with Question Mark */}
        <div
          className="flex flex-col items-center justify-center rounded-t-2xl border-b"
          style={{
            aspectRatio: "4/3",
            background: "linear-gradient(to bottom right, #EBF4FF, #DBEAFE)", // Blue-tinted gradient
            borderColor: "var(--color-timeline-card-border)",
          }}
        >
          <MessageSquarePlus
            className="mb-2"
            size={64}
            strokeWidth={1.5}
            style={{ color: "#3B82F6" }}
          />
          <p className="text-sm px-4 text-center" style={{ color: "#64748B" }}>
            What would you like to hear about?
          </p>
        </div>

        {/* Content Section */}
        <div className="px-4 py-4 space-y-3">
          {/* Title */}
          <h3
            className="text-[19px] font-semibold text-center"
            style={{ color: "var(--hw-text-primary)" }}
          >
            Suggest a Story
          </h3>

          {/* Subtitle */}
          <p
            className="text-[15px] text-center mx-auto"
            style={{ color: "var(--color-text-muted)", maxWidth: "320px" }}
          >
            Ask {firstName} about a memory, moment, or topic you'd love to hear
          </p>

          {/* CTA Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="w-full max-w-[280px] mx-auto block text-white font-semibold text-base py-3 rounded-full transition-all"
            style={{
              background: "linear-gradient(135deg, #3B82F6, #60A5FA)",
              boxShadow: isHovered
                ? "0 6px 16px rgba(59, 130, 246, 0.4)"
                : "0 4px 12px rgba(59, 130, 246, 0.3)",
              transform: isHovered ? "scale(1.02)" : "scale(1)",
            }}
            aria-label="Suggest a story topic"
          >
            + Request a Story
          </button>

          {/* Helper Text */}
          <p className="text-xs text-center" style={{ color: "#a8a29e" }}>
            {firstName} will see your suggestion
          </p>
        </div>

        {/* Focus visible state */}
        <style jsx>{`
          div:focus-visible {
            outline: 2px solid #3b82f6;
            outline-offset: 4px;
          }
        `}</style>
      </div>

      {/* Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-[525px] w-full max-h-[90vh] overflow-auto shadow-xl">
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-semibold">
                      Suggest a Story for {firstName}
                    </h2>
                    <p className="text-gray-600 mt-2 text-base leading-relaxed">
                      What would you like {firstName} to share? They'll see your
                      suggestion and can record a story about it.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDialogOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full -mr-2 -mt-2"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label htmlFor="question" className="text-base font-semibold">
                    Your Question or Topic *
                  </label>
                  <textarea
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Example: What was your wedding day like?"
                    className="mt-2 w-full min-h-[100px] text-base resize-none border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    {question.length}/500 characters
                  </p>
                </div>

                <div>
                  <label htmlFor="context" className="text-base">
                    Why is this meaningful to you? (Optional)
                  </label>
                  <textarea
                    id="context"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Example: I've always wondered about this..."
                    className="mt-2 w-full min-h-[80px] text-base resize-none border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    maxLength={300}
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    Adding context helps {firstName} understand why it matters to you
                  </p>
                </div>
              </div>

              <div className="p-6 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || question.trim().length < 10}
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Send Suggestion"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
