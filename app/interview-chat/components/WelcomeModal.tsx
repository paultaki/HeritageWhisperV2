"use client";

import { Button } from "@/components/ui/button";
import { Mic, MessageSquare, CheckCircle2 } from "lucide-react";

interface WelcomeModalProps {
  userName: string;
  onDismiss: () => void;
}

export function WelcomeModal({ userName, onDismiss }: WelcomeModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-in fade-in slide-in-from-bottom-4 duration-300"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
      >
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-rose-500 mx-auto mb-4 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {userName}!
          </h2>
          <p className="text-lg text-gray-600">
            Your Heritage Whisper Guided Interview
          </p>
        </div>

        {/* Instructions */}
        <div className="space-y-4 mb-8">
          <p className="text-gray-700 leading-relaxed">
            Over the next 10-15 minutes, I'll ask you questions about your life.
            This conversation will help you capture your memories in a meaningful way.
          </p>

          {/* Features */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Mic className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Record or Type</h3>
                <p className="text-sm text-gray-600">Answer with your voice or by typing - whichever feels natural</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MessageSquare className="w-4 h-4 text-rose-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Choose Your Path</h3>
                <p className="text-sm text-gray-600">Pick which follow-up questions interest you most</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Take Your Time</h3>
                <p className="text-sm text-gray-600">There's no rush - share as much or as little as you'd like</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          onClick={onDismiss}
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          Let's Begin
        </Button>

        {/* Helper text */}
        <p className="text-center text-sm text-gray-500 mt-4">
          This usually takes 10-15 minutes
        </p>
      </div>
    </div>
  );
}
