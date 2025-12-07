'use client';

import { CheckCircle2, Circle } from 'lucide-react';
import { validatePassword } from '@/lib/passwordValidation';
import { cn } from '@/lib/utils';

interface PasswordRequirementsProps {
  password: string;
  className?: string;
}

/**
 * Real-time password requirements with visual checkmarks.
 * Senior-friendly design with clear labels and high contrast.
 */
export function PasswordRequirements({
  password,
  className,
}: PasswordRequirementsProps) {
  const { results } = validatePassword(password);
  const hasStartedTyping = password.length > 0;

  return (
    <div
      className={cn('mt-3', className)}
      role="status"
      aria-live="polite"
      aria-label="Password requirements checklist"
    >
      <p className="text-sm text-[#4A4A4A] mb-2 font-medium">
        Password must include:
      </p>
      <ul className="space-y-1.5" aria-label="Password requirements">
        {results.map((rule) => {
          const isMet = rule.met;
          const statusText = isMet ? 'met' : 'not yet met';

          return (
            <li
              key={rule.id}
              className="flex items-center gap-2 text-sm"
              aria-label={`${rule.label}: ${statusText}`}
            >
              {isMet ? (
                <CheckCircle2
                  className="w-5 h-5 text-[#166534] flex-shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <Circle
                  className={cn(
                    'w-5 h-5 flex-shrink-0',
                    hasStartedTyping ? 'text-[#8A8378]' : 'text-[#8A8378]'
                  )}
                  aria-hidden="true"
                />
              )}
              <span
                className={cn(
                  'transition-colors duration-150',
                  isMet ? 'text-[#166534]' : 'text-[#8A8378]'
                )}
              >
                {rule.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
