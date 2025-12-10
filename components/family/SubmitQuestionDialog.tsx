'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquarePlus, X, Loader2 } from 'lucide-react';
import { useFamilyAuth } from '@/hooks/use-family-auth';
import { useNavVisibility } from '@/contexts/NavVisibilityContext';
import confetti from 'canvas-confetti';

type SubmitQuestionDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  storytellerUserId: string;
  storytellerName: string;
};

export function SubmitQuestionDialog({
  isOpen,
  onClose,
  storytellerUserId,
  storytellerName,
}: SubmitQuestionDialogProps) {
  const { session } = useFamilyAuth();
  const { hideNav, showNav } = useNavVisibility();
  const [promptText, setPromptText] = useState('');
  const [context, setContext] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  // Hide nav when dialog is open
  useEffect(() => {
    if (isOpen) {
      hideNav();
    } else {
      showNav();
    }
  }, [isOpen, hideNav, showNav]);

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

      // Close modal and hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 3000);
    } catch (err) {
      console.error('Error submitting prompt:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setPromptText('');
      setContext('');
      setError('');
      onClose();
    }
  };

  const charCount = promptText.length;
  const contextCharCount = context.length;

  if (!isOpen) return null;

  return (
    <>
      {/* Success Toast */}
      {showSuccess && (
        <div
          className="fixed top-4 right-4 z-[60] rounded-xl p-4 shadow-lg max-w-md border"
          style={{
            backgroundColor: 'var(--hw-secondary-soft, #DDE7E1)',
            borderColor: 'var(--hw-secondary, #3E6A5A)',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--hw-secondary, #3E6A5A)' }}
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold" style={{ color: 'var(--hw-text-primary, #1F1F1F)' }}>
                Question sent!
              </p>
              <p className="text-base mt-1" style={{ color: 'var(--hw-text-secondary, #4A4A4A)' }}>
                {storytellerName} will see it in their prompt library.
              </p>
            </div>
            <button
              onClick={() => setShowSuccess(false)}
              className="flex-shrink-0 p-1 rounded-lg transition-colors"
              style={{ color: 'var(--hw-secondary, #3E6A5A)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div
          className="rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
          style={{ backgroundColor: 'var(--hw-surface, #FFFFFF)' }}
        >
          {/* Header */}
          <div
            className="sticky top-0 p-6 rounded-t-2xl"
            style={{ backgroundColor: 'var(--hw-primary, #203954)' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Suggest a Question</h2>
                <p className="mt-1 text-base" style={{ color: 'var(--hw-primary-soft, #E0E5ED)' }}>
                  for {storytellerName}
                </p>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-2 rounded-lg transition-colors hover:bg-white/10"
                aria-label="Close dialog"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Question Field */}
            <div className="space-y-2">
              <label
                htmlFor="promptText"
                className="block text-base font-medium"
                style={{ color: 'var(--hw-text-primary, #1F1F1F)' }}
              >
                Your Question <span style={{ color: 'var(--hw-error, #B91C1C)' }}>*</span>
              </label>
              <textarea
                id="promptText"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder={`What question would you like ${storytellerName} to answer?`}
                className="w-full px-4 py-4 rounded-xl resize-none transition-all text-base"
                style={{
                  minHeight: '120px',
                  backgroundColor: 'var(--hw-surface, #FFFFFF)',
                  border: '1px solid var(--hw-border-subtle, #D2C9BD)',
                  color: 'var(--hw-text-primary, #1F1F1F)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--hw-primary, #203954)';
                  e.target.style.boxShadow = '0 0 0 2px var(--hw-primary, #203954)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--hw-border-subtle, #D2C9BD)';
                  e.target.style.boxShadow = 'none';
                }}
                maxLength={500}
                required
                disabled={isSubmitting}
              />
              <div className="flex justify-between items-center">
                <p className="text-base" style={{ color: 'var(--hw-text-muted, #8A8378)' }}>
                  Minimum 10 characters
                </p>
                <p
                  className="text-base font-medium"
                  style={{ color: charCount > 450 ? 'var(--hw-error, #B91C1C)' : 'var(--hw-text-muted, #8A8378)' }}
                >
                  {charCount}/500
                </p>
              </div>
            </div>

            {/* Context Field (Optional) */}
            <div className="space-y-2">
              <label
                htmlFor="context"
                className="block text-base font-medium"
                style={{ color: 'var(--hw-text-primary, #1F1F1F)' }}
              >
                Context <span style={{ color: 'var(--hw-text-muted, #8A8378)' }}>(optional)</span>
              </label>
              <textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Why is this question meaningful to you? Any additional details..."
                className="w-full px-4 py-4 rounded-xl resize-none transition-all text-base"
                style={{
                  minHeight: '100px',
                  backgroundColor: 'var(--hw-surface, #FFFFFF)',
                  border: '1px solid var(--hw-border-subtle, #D2C9BD)',
                  color: 'var(--hw-text-primary, #1F1F1F)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--hw-primary, #203954)';
                  e.target.style.boxShadow = '0 0 0 2px var(--hw-primary, #203954)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--hw-border-subtle, #D2C9BD)';
                  e.target.style.boxShadow = 'none';
                }}
                maxLength={500}
                disabled={isSubmitting}
              />
              <div className="flex justify-end">
                <p
                  className="text-base font-medium"
                  style={{ color: contextCharCount > 450 ? 'var(--hw-error, #B91C1C)' : 'var(--hw-text-muted, #8A8378)' }}
                >
                  {contextCharCount}/500
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="rounded-xl p-4 border"
                style={{
                  backgroundColor: '#FEF2F2',
                  borderColor: 'var(--hw-error, #B91C1C)',
                }}
              >
                <p className="text-base" style={{ color: 'var(--hw-error, #B91C1C)' }}>{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-2">
              {/* Cancel Button - Secondary style */}
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-6 py-4 rounded-xl font-medium transition-all active:scale-[0.98]"
                style={{
                  minHeight: '56px',
                  backgroundColor: 'var(--hw-surface, #FFFFFF)',
                  border: '1px solid var(--hw-border-subtle, #D2C9BD)',
                  color: 'var(--hw-text-primary, #1F1F1F)',
                  fontSize: '18px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--hw-section-bg, #EFE6DA)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--hw-surface, #FFFFFF)';
                }}
              >
                Cancel
              </button>

              {/* Submit Button - Primary style */}
              <button
                ref={submitButtonRef}
                type="submit"
                disabled={isSubmitting || promptText.trim().length < 10}
                className="flex-1 px-6 py-4 rounded-xl font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                style={{
                  minHeight: '56px',
                  backgroundColor: 'var(--hw-primary, #203954)',
                  color: 'white',
                  fontSize: '18px',
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = 'var(--hw-primary-hover, #1B3047)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--hw-primary, #203954)';
                }}
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
            <p
              className="text-base text-center pt-2"
              style={{ color: 'var(--hw-text-muted, #8A8378)' }}
            >
              Your question will appear in {storytellerName}&apos;s prompt library
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
