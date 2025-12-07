/**
 * Centralized password validation logic
 *
 * Single source of truth for password requirements.
 * If Supabase password policy changes, update ONLY this file.
 *
 * Supabase allowed special characters: !@#$%^&*()_+-=[]{};'\:"|<>?,./`~
 */

export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  results: Array<{
    id: string;
    label: string;
    met: boolean;
  }>;
}

/**
 * Password rules matching Supabase Auth policy.
 * Labels are senior-friendly with no technical jargon.
 */
export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: 'length',
    label: 'At least 8 characters',
    test: (pw: string) => pw.length >= 8,
  },
  {
    id: 'lowercase',
    label: 'A lowercase letter (a-z)',
    test: (pw: string) => /[a-z]/.test(pw),
  },
  {
    id: 'uppercase',
    label: 'An uppercase letter (A-Z)',
    test: (pw: string) => /[A-Z]/.test(pw),
  },
  {
    id: 'number',
    label: 'A number (0-9)',
    test: (pw: string) => /[0-9]/.test(pw),
  },
  {
    id: 'special',
    label: 'A special character (!@#$%...)',
    // Matches Supabase allowed symbols: !@#$%^&*()_+-=[]{};'\:"|<>?,./`~
    test: (pw: string) => /[!@#$%^&*()_+\-=\[\]{};'\\:"|<>?,./`~]/.test(pw),
  },
];

/**
 * Validate a password against all rules.
 * Returns validation status and per-rule results for UI display.
 */
export function validatePassword(password: string): PasswordValidationResult {
  const results = PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    met: rule.test(password),
  }));

  return {
    isValid: results.every((r) => r.met),
    results,
  };
}

/**
 * Check if a password meets all requirements.
 * Simpler version for form validation.
 */
export function isPasswordValid(password: string): boolean {
  return validatePassword(password).isValid;
}
