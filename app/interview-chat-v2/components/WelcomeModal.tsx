"use client";

import { Button } from "@/components/ui/button";
import { Mic, MessageSquare, CheckCircle2 } from "lucide-react";

interface WelcomeModalProps {
  userName: string;
  onDismiss: () => void;
}

export function WelcomeModal({ userName, onDismiss }: WelcomeModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div
        className="bg-[var(--hw-surface)] rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-lg w-full animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col"
        style={{
          maxHeight: '90vh',
        }}
      >
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pt-8 pb-4">
          {/* Welcome Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[var(--hw-primary-soft)] mx-auto mb-4 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-[var(--hw-primary)]" />
            </div>
            <h2 className="text-2xl font-semibold text-[var(--hw-text-primary)] mb-2">
              Welcome, {userName.split(' ')[0]}!
            </h2>
            <p className="text-lg text-[var(--hw-text-secondary)] leading-relaxed">
              I'm <span className="font-semibold text-[var(--hw-secondary)]">Pearl</span>, and I look forward to our conversation. I'll ask you questions about your life over the next 10-15 minutes.
            </p>
          </div>

          {/* Features - larger text for seniors */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--hw-primary-soft)] flex items-center justify-center flex-shrink-0">
                <Mic className="w-6 h-6 text-[var(--hw-primary)]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[var(--hw-text-primary)]">Record or Type</h3>
                <p className="text-base text-[var(--hw-text-secondary)]">Answer with your voice or typing</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--hw-secondary-soft)] flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-6 h-6 text-[var(--hw-secondary)]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[var(--hw-text-primary)]">Choose Your Path</h3>
                <p className="text-base text-[var(--hw-text-secondary)]">Pick questions that interest you</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--hw-secondary-soft)] flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-[var(--hw-success)]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[var(--hw-text-primary)]">Take Your Time</h3>
                <p className="text-base text-[var(--hw-text-secondary)]">Share as much as you'd like</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Button Area */}
        <div className="border-t border-[var(--hw-border-subtle)] px-6 py-6">
          <button
            onClick={onDismiss}
            className="w-full min-h-[60px] px-8 py-4 bg-[var(--hw-primary)] text-white text-lg font-medium rounded-xl shadow-sm hover:bg-[var(--hw-primary-hover)] hover:shadow-md active:scale-[0.98] transition-all"
          >
            Let's Begin →
          </button>
        </div>
      </div>
    </div>
  );
}
