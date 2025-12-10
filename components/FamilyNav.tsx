// components/FamilyNav.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Clock, BookOpen, MessageSquarePlus, Menu, X } from "lucide-react";
import { SubmitQuestionDialog } from "@/components/SubmitQuestionDialog";

type FamilyNavProps = {
  activeKey: "timeline" | "book" | "ask" | "menu";
  userId: string;
  storytellerName: string;
  permissionLevel?: "viewer" | "contributor";
  className?: string;
};

export default function FamilyNav({
  activeKey,
  userId,
  storytellerName,
  permissionLevel = "contributor",
  className,
}: FamilyNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [askDialogOpen, setAskDialogOpen] = useState(false);

  const navItems = [
    {
      key: "timeline",
      label: "Timeline",
      href: `/family/timeline-v2/${userId}`,
      Icon: Clock,
    },
    {
      key: "book",
      label: "Book",
      href: `/family/book/${userId}`,
      Icon: BookOpen,
    },
    {
      key: "ask",
      label: "Ask Question",
      href: "#",
      Icon: MessageSquarePlus,
      isHighlighted: true,
      isTwoLine: true,
      onClick: () => setAskDialogOpen(true),
    },
    {
      key: "menu",
      label: "Menu",
      href: "#",
      Icon: Menu,
      onClick: () => setMenuOpen(true),
    },
  ];

  return (
    <>
      <nav
        className={cn(
          // width and shape - responsive with safe margins
          "w-[86vw] max-w-[400px] rounded-[22px] overflow-hidden",
          // layout - evenly distributed spacing
          "flex items-start justify-around px-4 py-1.5",
          // glass core - brand-aligned with consistent darker background
          "backdrop-blur-[28px] saturate-[1.18] contrast-[1.22] brightness-[0.85]",
          "border border-white/50",
          "shadow-[0_20px_40px_-20px_rgba(0,0,0,0.45)]",
          // taupe tint based on brand color #866C7A
          "bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.06))]",
          "bg-[rgba(134,108,122,0.32)]",
          "relative",
          // subtle edge shadow for lift
          "after:content-[''] after:absolute after:inset-x-4 after:-bottom-2 after:h-3 after:rounded-[20px] after:blur-[14px] after:bg-black/10 after:pointer-events-none",
          className
        )}
        style={{
          position: "fixed",
          bottom: "calc(10px + env(safe-area-inset-bottom, 0px))",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
        }}
      >
        {/* refraction layer */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[-6%] opacity-15 bg-inherit [background-attachment:fixed] blur-[4px]"
          style={{ transform: "translate(0.8px,0.8px) scale(1.012)" }}
        />

        {/* Luminance-aware scrim */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 mix-blend-multiply opacity-60 bg-[radial-gradient(120%_200%_at_50%_-80%,rgba(134,108,122,0.20),transparent_55%),linear-gradient(0deg,rgba(134,108,122,0.15),transparent_40%)]"
        />

        {/* top lip highlight */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 [background:linear-gradient(180deg,rgba(255,255,255,0.28),transparent_42%)]"
        />

        {/* items */}
        {navItems.map(({ key, label, href, Icon, isHighlighted, isTwoLine, onClick }) => {
          const active = key === activeKey;
          const hasOnClick = !!onClick;

          const sharedClassName = cn(
            "group flex flex-col items-center justify-start px-1.5 py-1.5 rounded-[10px] transition-all duration-200 flex-1 gap-0.5",
            // Hover states
            "hover:bg-black/6 hover:scale-105",
            // Active states
            active && "bg-black/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] -translate-y-0.5"
          );

          const content = (
            <>
              {Icon && (
                <Icon
                  className={cn(
                    "w-[18px] h-[18px] transition-colors duration-200",
                    isHighlighted
                      ? "text-blue-600"
                      : active
                      ? "text-black"
                      : "text-black/85"
                  )}
                />
              )}
              {isTwoLine ? (
                <span
                  className={cn(
                    "relative text-[10px] leading-3 font-bold text-center transition-colors duration-200",
                    isHighlighted
                      ? "text-blue-600"
                      : active
                      ? "text-black"
                      : "text-black/85"
                  )}
                >
                  Ask<br />Question
                  {active && (
                    <i className="absolute left-1/2 -translate-x-1/2 -bottom-[2px] block w-5 h-[2px] rounded-full bg-black/70" />
                  )}
                </span>
              ) : (
                <span
                  className={cn(
                    "relative text-[10px] leading-3 font-medium text-center transition-colors duration-200",
                    isHighlighted
                      ? "text-blue-600"
                      : active
                      ? "text-black"
                      : "text-black/85"
                  )}
                >
                  {label}
                  {active && (
                    <i className="absolute left-1/2 -translate-x-1/2 -bottom-[2px] block w-5 h-[2px] rounded-full bg-black/70" />
                  )}
                </span>
              )}
            </>
          );

          return hasOnClick ? (
            <button
              key={key}
              onClick={onClick}
              type="button"
              data-nav-button={key}
              className={sharedClassName}
            >
              {content}
            </button>
          ) : (
            <Link key={key} href={href} className={sharedClassName}>
              {content}
            </Link>
          );
        })}
      </nav>

      {/* Ask Question Dialog */}
      {askDialogOpen && (
        <SubmitQuestionDialogControlled
          storytellerId={userId}
          storytellerName={storytellerName}
          open={askDialogOpen}
          onOpenChange={setAskDialogOpen}
        />
      )}

      {/* Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-4">
                You're viewing <strong>{storytellerName}'s</strong> stories as a{" "}
                {permissionLevel === "contributor" ? "contributor" : "viewer"}.
              </p>
              <Link
                href="/family/access"
                className="block w-full text-left px-4 py-3 text-sm hover:bg-gray-50 rounded-lg"
                onClick={() => setMenuOpen(false)}
              >
                Switch Account
              </Link>
              <button
                onClick={() => {
                  // Clear family session
                  document.cookie = "family_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                  window.location.href = "/family/access";
                }}
                className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Controlled version of SubmitQuestionDialog for external state management
function SubmitQuestionDialogControlled({
  storytellerId,
  storytellerName,
  open,
  onOpenChange,
}: {
  storytellerId: string;
  storytellerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      alert(`Question submitted! ${storytellerName} will see your question.`);
      onOpenChange(false);
      setQuestion("");
      setContext("");
    } catch (error: any) {
      alert(error.message || "Failed to submit question");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-[525px] w-full max-h-[90vh] overflow-auto shadow-xl">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-semibold">
                  Ask {storytellerName} a Question
                </h2>
                <p className="text-gray-600 mt-2 text-base leading-relaxed">
                  Submit a question you'd like {storytellerName} to answer.
                  They'll see it when they're ready to record their next story.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="p-2 hover:bg-gray-100 rounded-full -mr-2 -mt-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="question" className="text-base font-semibold">
                Your Question *
              </label>
              <textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Example: What was your first job like?"
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
                Why do you want to know? (Optional)
              </label>
              <textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Example: I'm curious about your career journey..."
                className="mt-2 w-full min-h-[80px] text-base resize-none border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={300}
              />
              <p className="text-xs text-gray-500 mt-1.5">
                Adding context helps them give a better answer
              </p>
            </div>
          </div>

          <div className="p-6 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || question.trim().length < 10}
              className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
