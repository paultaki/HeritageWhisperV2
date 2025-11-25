"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { signInWithGoogle } from "@/lib/supabase";
import { Eye, EyeOff, Mail, Lock, LogIn, Feather, Mic } from "lucide-react";
import { PasskeyAuth } from "@/components/auth/PasskeyAuth";
import { PasskeySetupPrompt } from "@/components/auth/PasskeySetupPrompt";

// Prevent static generation for this auth page
export const dynamic = 'force-dynamic';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [hasPasskeys, setHasPasskeys] = useState(false);
  const [showPasskeySetup, setShowPasskeySetup] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const router = useRouter();
  const { login, user } = useAuth();
  const { toast } = useToast();

  // Mark client-side as hydrated
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load saved email if "Remember me" was checked
  useEffect(() => {
    if (!isClient) return;

    const savedEmail = localStorage.getItem('savedEmail');
    const savedRememberMe = localStorage.getItem('rememberMe');

    if (savedEmail && savedRememberMe === 'true') {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, [isClient]);

  // Check if user has passkeys when email changes
  useEffect(() => {
    const checkPasskeys = async () => {
      if (!email || !email.includes("@")) {
        setHasPasskeys(false);
        return;
      }

      try {
        const res = await fetch("/api/passkey/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        });

        if (res.ok) {
          const data = await res.json();
          setHasPasskeys(data.hasPasskeys);
        }
      } catch (err) {
        // Silently fail - just don't show passkey button
        setHasPasskeys(false);
      }
    };

    // Debounce the check
    const timeoutId = setTimeout(checkPasskeys, 500);
    return () => clearTimeout(timeoutId);
  }, [email]);

  // Redirect if already logged in (but not if showing passkey setup)
  useEffect(() => {
    if (user && !showPasskeySetup) {
      router.push("/timeline");
    }
  }, [user, router, showPasskeySetup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Store remember me preference and email
      if (typeof window !== 'undefined') {
        localStorage.setItem('rememberMe', rememberMe ? 'true' : 'false');

        if (rememberMe) {
          localStorage.setItem('savedEmail', email);
        } else {
          localStorage.removeItem('savedEmail');
        }
      }

      const result = await login(email, password);

      // After successful login, check if we should prompt for passkey setup
      // Show prompt if:
      // 1. loginCount >= 2 (not first login)
      // 2. User doesn't have passkeys
      // 3. User hasn't permanently dismissed the prompt
      if (typeof window !== 'undefined' && result?.user) {
        const { loginCount, passkeyPromptDismissed } = result.user;

        console.log('[Login] Checking passkey prompt conditions:', {
          loginCount,
          passkeyPromptDismissed,
        });

        // Check if user has passkeys
        const checkRes = await fetch("/api/passkey/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase() }),
        });

        if (checkRes.ok) {
          const { hasPasskeys } = await checkRes.json();

          console.log('[Login] Passkey check result:', { hasPasskeys });

          // Show prompt on 2nd+ login if no passkeys and not dismissed as 'never'
          if (
            (loginCount ?? 0) >= 2 &&
            !hasPasskeys &&
            passkeyPromptDismissed !== "never"
          ) {
            console.log('[Login] Showing passkey setup prompt');
            setLoginCredentials({ email, password });
            setShowPasskeySetup(true);
            return; // Don't redirect yet
          }
        }
      }

      // If we didn't show the prompt, navigate to timeline
      console.log('[Login] No passkey prompt needed, navigating to timeline');
      router.push("/timeline");
    } catch (error: any) {
      toast({
        title: "Authentication failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
    }
  };

  const handlePasskeySuccess = () => {
    // Passkey authentication creates a session cookie automatically
    // Force a hard redirect to ensure auth context refreshes
    window.location.href = "/timeline";
  };

  const handlePasskeyError = (error: string) => {
    toast({
      title: "Passkey authentication failed",
      description: error,
      variant: "destructive",
    });
  };

  return (
    <div className="hw-page antialiased" style={{ fontSize: '16px', backgroundColor: 'var(--hw-page-bg, #F7F2EC)' }}>
      {/* Background: subtle warm paper texture with soft accents */}
      <div aria-hidden="true" className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* soft radial glow center - using primary blue and gold */}
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(60% 60% at 65% 20%, rgba(203,164,106,.08) 0%, rgba(32,57,84,.05) 40%, rgba(255,255,255,0) 70%)" }}
        />

        {/* static blob 1 - muted gold and secondary green */}
        <div
          className="absolute -top-24 -right-24 w-[36rem] h-[36rem] rounded-full blur-2xl"
          style={{ background: "radial-gradient(circle at 30% 30%, rgba(203,164,106,.18), rgba(62,106,90,.08))" }}
        />

        {/* static blob 2 - soft primary and gold */}
        <div
          className="absolute -bottom-24 -left-16 w-[32rem] h-[32rem] rounded-full blur-2xl"
          style={{ background: "radial-gradient(circle at 70% 70%, rgba(32,57,84,.12), rgba(203,164,106,.10))" }}
        />

        {/* static horizontal sheen - subtle gold accent */}
        <div
          className="absolute inset-x-0 top-1/3 h-48 opacity-40"
          style={{ background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(203,164,106,.15) 40%, rgba(244,230,204,.18) 60%, rgba(255,255,255,0) 100%)" }}
        />
      </div>

      <main className="relative z-10 flex hw-page items-center">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

            {/* Left: Brand and copy */}
            <section className="order-1 lg:order-1" style={{ paddingTop: '24px' }}>
              <div className="inline-flex items-center gap-3 mb-6">
                <div
                  className="relative grid place-items-center w-12 h-12 rounded-xl shadow-lg"
                  style={{ backgroundColor: 'var(--hw-primary, #203954)', boxShadow: '0 4px 12px rgba(32,57,84,0.2)', transform: 'translateY(-2px)' }}
                >
                  <Mic className="w-6 h-6" style={{ color: 'var(--hw-text-on-dark, #FFFFFF)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <p className="font-medium" style={{ fontSize: '18px', margin: 0, lineHeight: '1.1', fontWeight: 'bold', color: 'var(--hw-secondary, #3E6A5A)' }}>Welcome to</p>
                  <p className="font-semibold tracking-tight" style={{ fontFamily: "serif", fontSize: '28px', margin: 0, marginTop: '-1px', lineHeight: '1.2', color: 'var(--hw-text-primary, #1F1F1F)' }}>
                    Heritage Whisper
                  </p>
                </div>
              </div>

              <h1 className="font-semibold tracking-tight" style={{ fontSize: '38px', lineHeight: '1.1', color: 'var(--hw-text-primary, #1F1F1F)' }}>
                Sign in to{" "}
                <span style={{ color: 'var(--hw-primary, #203954)' }}>
                  continue your story
                </span>
              </h1>
              <p className="mt-4 max-w-xl" style={{ fontSize: '22px', lineHeight: '1.4', color: 'var(--hw-text-secondary, #4A4A4A)' }}>
                A quiet space where family memories become timeless keepsakes.
              </p>

              {/* Feature bullets */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 max-w-xl" style={{ marginTop: '20px', marginBottom: '12px', gap: '16px' }}>
                <div className="flex items-start gap-3">
                  <span className="inline-grid place-items-center w-9 h-9 rounded-lg backdrop-blur" style={{ backgroundColor: 'var(--hw-surface, #FFFFFF)', border: '1px solid var(--hw-border-subtle, #D2C9BD)' }}>
                    <Feather className="w-5 h-5" style={{ color: 'var(--hw-secondary, #3E6A5A)' }} />
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <p className="font-medium" style={{ fontSize: '20px', margin: 0, lineHeight: '1.2', color: 'var(--hw-text-primary, #1F1F1F)' }}>Capture voices</p>
                    <p style={{ fontSize: '17px', margin: 0, marginTop: '2px', lineHeight: '1.4', color: 'var(--hw-text-secondary, #4A4A4A)' }}>Record and preserve in warm detail.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="inline-grid place-items-center w-9 h-9 rounded-lg backdrop-blur" style={{ backgroundColor: 'var(--hw-surface, #FFFFFF)', border: '1px solid var(--hw-border-subtle, #D2C9BD)' }}>
                    <Lock className="w-5 h-5" style={{ color: 'var(--hw-accent-gold, #CBA46A)' }} />
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <p className="font-medium" style={{ fontSize: '20px', margin: 0, lineHeight: '1.2', color: 'var(--hw-text-primary, #1F1F1F)' }}>Private by design</p>
                    <p style={{ fontSize: '17px', margin: 0, marginTop: '2px', lineHeight: '1.4', color: 'var(--hw-text-secondary, #4A4A4A)' }}>Your memories stay in the family.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Right: Form */}
            <section className="order-2 lg:order-2 mt-8 lg:mt-0" style={{ marginTop: '-8px' }}>
              <div className="mx-auto max-w-md">
                {/* Card with subtle border */}
                <div
                  className="rounded-2xl shadow-xl"
                  style={{
                    backgroundColor: 'var(--hw-surface, #FFFFFF)',
                    border: '1px solid var(--hw-border-subtle, #D2C9BD)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 8px 24px rgba(32,57,84,0.08)'
                  }}
                >
                  <div className="p-6 sm:p-8">
                    <header className="mb-6">
                      <h2 className="font-semibold tracking-tight" style={{ fontSize: '28px', fontFamily: 'system-ui, -apple-system, sans-serif', color: 'var(--hw-text-primary, #1F1F1F)' }}>Login</h2>
                      <p className="mt-1" style={{ fontSize: '20px', fontFamily: 'system-ui, -apple-system, sans-serif', color: 'var(--hw-text-secondary, #4A4A4A)' }}>Enter your details to continue.</p>
                    </header>

                    <form onSubmit={handleSubmit} className="space-y-5" suppressHydrationWarning>
                        {/* Email */}
                        <div>
                          <label htmlFor="email" className="block font-medium" style={{ fontSize: '16px', fontFamily: 'system-ui, -apple-system, sans-serif', color: 'var(--hw-text-primary, #1F1F1F)' }}>
                            Email address
                          </label>
                          <div className="mt-2 relative">
                            <input
                              id="email"
                              name="email"
                              type="email"
                              autoComplete="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                              style={{
                                fontSize: '16px',
                                paddingRight: '40px',
                                padding: '12px 40px 12px 16px',
                                backgroundColor: 'var(--hw-surface, #FFFFFF)',
                                border: '1px solid var(--hw-border-subtle, #D2C9BD)',
                                color: 'var(--hw-text-primary, #1F1F1F)',
                                '--tw-ring-color': 'var(--hw-primary, #203954)',
                                '--tw-ring-offset-color': 'var(--hw-page-bg, #F7F2EC)'
                              } as React.CSSProperties}
                              placeholder="you@example.com"
                              data-testid="input-email"
                              suppressHydrationWarning
                            />
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                              <Mail className="w-5 h-5" style={{ color: 'var(--hw-text-muted, #8A8378)' }} />
                            </div>
                          </div>
                        </div>

                        {/* Password */}
                        <div>
                          <label htmlFor="password" className="block font-medium" style={{ fontSize: '16px', fontFamily: 'system-ui, -apple-system, sans-serif', color: 'var(--hw-text-primary, #1F1F1F)' }}>
                            Password
                          </label>
                          <div className="mt-2 relative">
                            <input
                              id="password"
                              name="password"
                              type={showPassword ? "text" : "password"}
                              autoComplete="current-password"
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleSubmit(e as any);
                                }
                              }}
                              className="w-full rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                              style={{
                                fontSize: '16px',
                                paddingRight: '40px',
                                padding: '12px 40px 12px 16px',
                                backgroundColor: 'var(--hw-surface, #FFFFFF)',
                                border: '1px solid var(--hw-border-subtle, #D2C9BD)',
                                color: 'var(--hw-text-primary, #1F1F1F)',
                                '--tw-ring-color': 'var(--hw-primary, #203954)',
                                '--tw-ring-offset-color': 'var(--hw-page-bg, #F7F2EC)'
                              } as React.CSSProperties}
                              placeholder="••••••••"
                              data-testid="input-password"
                              suppressHydrationWarning
                            />
                            <div
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-3 flex items-center transition-colors cursor-pointer"
                              style={{ color: 'var(--hw-text-muted, #8A8378)' }}
                              aria-label="Toggle password visibility"
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  setShowPassword(!showPassword);
                                }
                              }}
                            >
                              {showPassword ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Options */}
                        <div className="flex items-center justify-between" style={{ alignItems: 'center' }}>
                          {/* Custom checkbox */}
                          <button
                            type="button"
                            className="inline-flex items-center gap-3 cursor-pointer select-none"
                            style={{ margin: 0, padding: 0, background: 'none', border: 'none' }}
                            onClick={() => {
                              const newValue = !rememberMe;
                              setRememberMe(newValue);
                              if (!newValue && typeof window !== 'undefined') {
                                localStorage.removeItem('savedEmail');
                              }
                            }}
                            aria-pressed={rememberMe}
                          >
                            <span
                              className="grid place-items-center w-5 h-5 rounded-md shadow-sm transition"
                              style={{
                                border: rememberMe ? 'none' : '1px solid var(--hw-border-subtle, #D2C9BD)',
                                backgroundColor: rememberMe ? 'var(--hw-primary, #203954)' : 'var(--hw-surface, #FFFFFF)'
                              }}
                            >
                              <svg
                                className="w-3.5 h-3.5 transition"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ color: '#FFFFFF', opacity: rememberMe ? 1 : 0 }}
                              >
                                <path d="M20 6 9 17l-5-5"/>
                              </svg>
                            </span>
                            <span className="font-medium" style={{ fontSize: '16px', lineHeight: '1.5', fontFamily: 'system-ui, -apple-system, sans-serif', color: 'var(--hw-text-primary, #1F1F1F)' }}>Remember me</span>
                          </button>
                          <Link href="/auth/forgot-password" className="font-medium hover:underline" style={{ fontSize: '16px', lineHeight: '1.5', display: 'flex', alignItems: 'center', fontFamily: 'system-ui, -apple-system, sans-serif', color: 'var(--hw-primary, #203954)' }}>
                            Forgot password?
                          </Link>
                        </div>

                        {/* Submit */}
                        <button
                          type="submit"
                          className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold shadow-lg transition active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2"
                          style={{
                            fontSize: '17px',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            minHeight: '60px',
                            backgroundColor: 'var(--hw-primary, #203954)',
                            color: 'var(--hw-text-on-dark, #FFFFFF)',
                            boxShadow: '0 4px 12px rgba(32,57,84,0.2)',
                            '--tw-ring-color': 'var(--hw-primary, #203954)',
                            '--tw-ring-offset-color': 'var(--hw-page-bg, #F7F2EC)'
                          } as React.CSSProperties}
                          data-testid="button-login"
                          suppressHydrationWarning
                        >
                          <LogIn className="w-5 h-5" />
                          Continue
                        </button>

                        {/* Divider */}
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t" style={{ borderColor: 'var(--hw-border-subtle, #D2C9BD)' }}></div>
                          </div>
                          <div className="relative flex justify-center">
                            <span className="backdrop-blur px-3" style={{ fontSize: '14px', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: 'var(--hw-surface, #FFFFFF)', color: 'var(--hw-text-muted, #8A8378)' }}>or</span>
                          </div>
                        </div>

                        {/* Google Sign-in */}
                        <button
                          type="button"
                          onClick={signInWithGoogle}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-medium transition hover:shadow-md"
                          style={{
                            fontSize: '16px',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            border: '1px solid var(--hw-border-subtle, #D2C9BD)',
                            backgroundColor: 'var(--hw-surface, #FFFFFF)',
                            color: 'var(--hw-text-primary, #1F1F1F)'
                          }}
                          data-testid="button-google-signin"
                          suppressHydrationWarning
                        >
                          <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Continue with Google
                        </button>

                        {/* Passkey Sign-in - only show if user has passkeys */}
                        {hasPasskeys && (
                          <PasskeyAuth
                            mode="authenticate"
                            onSuccess={handlePasskeySuccess}
                            onError={handlePasskeyError}
                          />
                        )}
                    </form>

                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '24px' }}>
                      <p style={{ fontSize: '18px', textAlign: 'center', margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', color: 'var(--hw-text-secondary, #4A4A4A)' }}>
                        New here?{" "}
                        <Link href="/auth/register" className="font-medium hover:underline" style={{ color: 'var(--hw-primary, #203954)' }}>
                          Create an account
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Small reassurance */}
                <p className="mt-4 text-center" style={{ fontSize: '15px', fontFamily: 'system-ui, -apple-system, sans-serif', color: 'var(--hw-text-muted, #8A8378)' }}>
                  Protected with end-to-end encryption and secure sharing controls.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes floatBlob {
          0%, 100% {
            transform: translate3d(0,0,0) scale(1);
            opacity: .55;
          }
          50% {
            transform: translate3d(12px,-18px,0) scale(1.04);
            opacity: .7;
          }
        }
        @keyframes driftBlob {
          0%, 100% {
            transform: translate3d(0,0,0) scale(1);
            opacity: .45;
          }
          50% {
            transform: translate3d(-16px,14px,0) scale(1.06);
            opacity: .65;
          }
        }
        @keyframes gentlePulse {
          0%, 100% {
            opacity: .5;
            filter: blur(40px);
          }
          50% {
            opacity: .65;
            filter: blur(46px);
          }
        }
      `}</style>

      {/* Passkey Setup Prompt - shown after successful email/password login */}
      {loginCredentials && (
        <PasskeySetupPrompt
          email={loginCredentials.email}
          password={loginCredentials.password}
          isOpen={showPasskeySetup}
          onClose={() => {
            setShowPasskeySetup(false);
            setLoginCredentials(null);
            // Redirect to timeline after closing prompt
            router.push("/timeline");
          }}
          onSuccess={() => {
            toast({
              title: "Passkey set up!",
              description: "You can now sign in with your fingerprint or face.",
            });
          }}
        />
      )}
    </div>
  );
}
