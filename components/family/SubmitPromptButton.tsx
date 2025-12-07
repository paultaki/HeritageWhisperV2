'use client';

import { useState, useRef } from 'react';
import { MessageSquarePlus, X, Loader2 } from 'lucide-react';
import { useFamilyAuth } from '@/hooks/use-family-auth';
import confetti from 'canvas-confetti';

type SubmitPromptButtonProps = {
  storytellerUserId: string;
  storytellerName: string;
};

export function SubmitPromptButton({ storytellerUserId, storytellerName }: SubmitPromptButtonProps) {
  const { session } = useFamilyAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [context, setContext] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  // Confetti celebration function (same as family invite)
  const celebrateSubmission = () => {
    const button = submitButtonRef.current;
    let origin = { x: 0.5, y: 0.5 };

    if (button) {
      const rect = button.getBoundingClientRect();
      origin = {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
      };
    }

    confetti({
      particleCount: 100,
      spread: 70,
      origin: origin,
      colors: ['#203954', '#3E6A5A', '#CBA46A', '#F4E6CC', '#F7F2EC'],
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: origin,
        colors: ['#203954', '#3E6A5A', '#CBA46A', '#F4E6CC', '#F7F2EC'],
      });
    }, 150);

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: origin,
        colors: ['#203954', '#3E6A5A', '#CBA46A', '#F4E6CC', '#F7F2EC'],
      });
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!session) {
        setError('Session expired. Please refresh the page.');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/family/prompts', {
        method: 'POST',
        credentials: 'include', // Send HttpOnly cookie
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storytellerUserId,
          promptText,
          context,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit question');
        setIsSubmitting(false);
        return;
      }

      // Success! Fire confetti then show success message
      celebrateSubmission();
      setShowSuccess(true);
      setPromptText('');
      setContext('');
      setIsOpen(false);

      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err) {
      console.error('Error submitting prompt:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const charCount = promptText.length;
  const contextCharCount = context.length;

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
                {storytellerName} will see it in their prompt library.
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

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 z-40"
        title="Suggest a Question"
      >
        <MessageSquarePlus className="w-6 h-6" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Suggest a Question</h2>
                  <p className="text-amber-50 mt-1">for {storytellerName}</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white transition-colors"
                  disabled={isSubmitting}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Question Field */}
              <div>
                <label htmlFor="promptText" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Question <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="promptText"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder={`What question would you like ${storytellerName} to answer?`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  rows={4}
                  maxLength={500}
                  required
                  disabled={isSubmitting}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">Minimum 10 characters</p>
                  <p className={`text-xs ${charCount > 450 ? 'text-rose-600 font-medium' : 'text-gray-500'}`}>
                    {charCount}/500
                  </p>
                </div>
              </div>

              {/* Context Field (Optional) */}
              <div>
                <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-2">
                  Context <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  id="context"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Why is this question meaningful to you? Any additional details..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  rows={3}
                  maxLength={500}
                  disabled={isSubmitting}
                />
                <div className="flex justify-end mt-1">
                  <p className={`text-xs ${contextCharCount > 450 ? 'text-rose-600 font-medium' : 'text-gray-500'}`}>
                    {contextCharCount}/500
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                  <p className="text-sm text-rose-700">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  ref={submitButtonRef}
                  type="submit"
                  disabled={isSubmitting || promptText.trim().length < 10}
                  className="flex-1 px-4 py-3 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white rounded-lg hover:shadow-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <MessageSquarePlus className="w-5 h-5" />
                      Send Question
                    </>
                  )}
                </button>
              </div>

              {/* Helper Text */}
              <p className="text-xs text-gray-500 text-center pt-2">
                Your question will appear in {storytellerName}'s prompt library
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
