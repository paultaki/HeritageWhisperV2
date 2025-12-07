"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { signInWithGoogle } from "@/lib/supabase";
import { Eye, EyeOff, Mail, Lock, User, Calendar, Shield, UserPlus } from "lucide-react";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";

// Prevent static generation for this auth page
export const dynamic = 'force-dynamic';

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [betaCode, setBetaCode] = useState("");
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const router = useRouter();
  const { register, user } = useAuth();
  const { toast } = useToast();
  
  // Check if beta code is required (disabled for open registration)
  const requireBetaCode = process.env.NEXT_PUBLIC_REQUIRE_BETA_CODE === "true";

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/timeline");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!name || !birthYear) {
        toast({
          title: "All fields required",
          description: "Please enter your name and birth year to continue",
          variant: "destructive",
        });
        return;
      }
      
      if (requireBetaCode && !betaCode) {
        toast({
          title: "Beta code required",
          description: "Please enter a valid beta access code to continue",
          variant: "destructive",
        });
        return;
      }
      
      await register(email, password, name, parseInt(birthYear), betaCode);
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description:
          error.message || "Please check your information and try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="hw-page flex items-center justify-center p-4" style={{ backgroundColor: 'var(--hw-page-bg, #F7F2EC)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          {/* Heritage Whisper Logo */}
          <div
            className="mx-auto mb-8 cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center"
            onClick={() => router.push("/")}
          >
            <Image
              src="/final logo/logo-new.svg"
              alt="HeritageWhisper"
              width={240}
              height={56}
              className="h-14 w-auto"
              priority
            />
          </div>
          <p className="font-medium text-center" style={{ fontSize: '24px', color: 'var(--hw-text-secondary, #4A4A4A)' }}>
            Your voice. Their treasure. Forever.
          </p>
        </div>

        <Card className="shadow-lg" style={{ backgroundColor: 'var(--hw-surface, #FFFFFF)', border: '1px solid var(--hw-border-subtle, #D2C9BD)', boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 8px 24px rgba(32,57,84,0.08)' }}>
          <CardContent className="pt-8 pb-8 px-8">
            <h2 className="font-semibold text-center mb-3" style={{ fontSize: '28px', color: 'var(--hw-text-primary, #1F1F1F)' }}>
              Create Your Story
            </h2>

            {/* Protected Session Badge */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'var(--hw-secondary-soft, #DDE7E1)', border: '1px solid var(--hw-secondary, #3E6A5A)' }}>
                <Shield className="h-3.5 w-3.5" style={{ color: 'var(--hw-secondary, #3E6A5A)' }} />
                <span className="font-medium" style={{ fontSize: '12px', color: 'var(--hw-secondary, #3E6A5A)' }}>Protected Session</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" suppressHydrationWarning>
              <div>
                <Label htmlFor="email" className="font-medium" style={{ fontSize: '16px', color: 'var(--hw-text-primary, #1F1F1F)' }}>
                  Email
                </Label>
                <div className="relative mt-3">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5" style={{ color: 'var(--hw-text-muted, #8A8378)' }} />
                  </div>
                  <Input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-lg py-4 pl-10"
                    style={{
                      backgroundColor: 'var(--hw-surface, #FFFFFF)',
                      border: '1px solid var(--hw-border-subtle, #D2C9BD)',
                      color: 'var(--hw-text-primary, #1F1F1F)'
                    }}
                    placeholder="your@email.com"
                    required
                    autoComplete="email"
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="font-medium" style={{ fontSize: '16px', color: 'var(--hw-text-primary, #1F1F1F)' }}>
                  Password
                </Label>
                <div className="mt-3 flex items-center gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5" style={{ color: 'var(--hw-text-muted, #8A8378)' }} />
                    </div>
                    <Input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="text-lg py-4 pl-10 pr-12 w-full"
                      style={{
                        backgroundColor: 'var(--hw-surface, #FFFFFF)',
                        border: '1px solid var(--hw-border-subtle, #D2C9BD)',
                        color: 'var(--hw-text-primary, #1F1F1F)'
                      }}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                      data-testid="input-password"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="focus:outline-none transition-colors"
                        style={{ color: 'var(--hw-text-muted, #8A8378)' }}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password requirements with real-time checkmarks */}
                <PasswordRequirements password={password} />
              </div>

              {requireBetaCode && (
                <div>
                  <Label htmlFor="betaCode" className="font-medium" style={{ fontSize: '16px', color: 'var(--hw-text-primary, #1F1F1F)' }}>
                    Beta Access Code
                  </Label>
                  <div className="relative mt-3">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Shield className="h-5 w-5" style={{ color: 'var(--hw-text-muted, #8A8378)' }} />
                    </div>
                    <Input
                      type="text"
                      id="betaCode"
                      value={betaCode}
                      onChange={(e) => setBetaCode(e.target.value.toUpperCase())}
                      className="text-lg py-4 pl-10 font-mono"
                      style={{
                        backgroundColor: 'var(--hw-surface, #FFFFFF)',
                        border: '1px solid var(--hw-border-subtle, #D2C9BD)',
                        color: 'var(--hw-text-primary, #1F1F1F)'
                      }}
                      placeholder="Enter your beta code"
                      required={requireBetaCode}
                      autoComplete="off"
                      data-testid="input-beta-code"
                      maxLength={8}
                    />
                  </div>
                  <p className="mt-2" style={{ fontSize: '14px', color: 'var(--hw-text-secondary, #4A4A4A)' }}>
                    Enter the beta access code you received
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="name" className="font-medium" style={{ fontSize: '16px', color: 'var(--hw-text-primary, #1F1F1F)' }}>
                  Full Name
                </Label>
                <div className="relative mt-3">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5" style={{ color: 'var(--hw-text-muted, #8A8378)' }} />
                  </div>
                  <Input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-lg py-4 pl-10"
                    style={{
                      backgroundColor: 'var(--hw-surface, #FFFFFF)',
                      border: '1px solid var(--hw-border-subtle, #D2C9BD)',
                      color: 'var(--hw-text-primary, #1F1F1F)'
                    }}
                    placeholder="Your full name"
                    required
                    autoComplete="name"
                    data-testid="input-name"
                  />
                </div>
                <p className="mt-2" style={{ fontSize: '16px', color: 'var(--hw-text-secondary, #4A4A4A)' }}>
                  This will appear on your timeline
                </p>
              </div>

              <div>
                <Label htmlFor="birthYear" className="font-medium" style={{ fontSize: '16px', color: 'var(--hw-text-primary, #1F1F1F)' }}>
                  Birth Year
                </Label>
                <div className="relative mt-3">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5" style={{ color: 'var(--hw-text-muted, #8A8378)' }} />
                  </div>
                  <Input
                    type="number"
                    id="birthYear"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="text-lg py-4 pl-10"
                    style={{
                      backgroundColor: 'var(--hw-surface, #FFFFFF)',
                      border: '1px solid var(--hw-border-subtle, #D2C9BD)',
                      color: 'var(--hw-text-primary, #1F1F1F)'
                    }}
                    placeholder="1952"
                    min="1920"
                    max="2010"
                    required
                    autoComplete="bday-year"
                    data-testid="input-birth-year"
                  />
                </div>
                <p className="mt-2" style={{ fontSize: '16px', color: 'var(--hw-text-secondary, #4A4A4A)' }}>
                  This helps us create your timeline
                </p>
              </div>

              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded cursor-pointer"
                  style={{
                    border: '1px solid var(--hw-border-subtle, #D2C9BD)',
                    accentColor: 'var(--hw-primary, #203954)'
                  }}
                  data-testid="checkbox-terms"
                />
                <Label
                  htmlFor="terms"
                  className="font-normal leading-relaxed cursor-pointer"
                  style={{ fontSize: '14px', color: 'var(--hw-text-primary, #1F1F1F)' }}
                >
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="hover:underline font-medium"
                    style={{ color: 'var(--hw-primary, #203954)' }}
                    target="_blank"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="hover:underline font-medium"
                    style={{ color: 'var(--hw-primary, #203954)' }}
                    target="_blank"
                  >
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              <Button
                type="submit"
                className="relative w-full font-semibold py-4 transition-all duration-300 overflow-hidden flex items-center justify-center gap-2 group rounded-xl shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  fontSize: '18px',
                  minHeight: '60px',
                  backgroundColor: 'var(--hw-primary, #203954)',
                  color: 'var(--hw-text-on-dark, #FFFFFF)',
                  boxShadow: '0 4px 12px rgba(32,57,84,0.2)',
                  '--tw-ring-color': 'var(--hw-primary, #203954)',
                  '--tw-ring-offset-color': 'var(--hw-page-bg, #F7F2EC)'
                } as React.CSSProperties}
                disabled={!agreedToTerms}
                data-testid="button-register"
              >
                <UserPlus className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  Create My Timeline
                </span>
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" style={{ borderColor: 'var(--hw-border-subtle, #D2C9BD)' }} />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3" style={{ fontSize: '14px', backgroundColor: 'var(--hw-surface, #FFFFFF)', color: 'var(--hw-text-muted, #8A8378)' }}>Or</span>
              </div>
            </div>

            {/* Google Sign-in Button */}
            <Button
              type="button"
              onClick={signInWithGoogle}
              variant="outline"
              className="w-full font-medium py-4 flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-md rounded-xl"
              style={{
                fontSize: '16px',
                border: '1px solid var(--hw-border-subtle, #D2C9BD)',
                backgroundColor: 'var(--hw-surface, #FFFFFF)',
                color: 'var(--hw-text-primary, #1F1F1F)'
              }}
              data-testid="button-google-signin"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
                <path fill="none" d="M1 1h22v22H1z" />
              </svg>
              Continue with Google
            </Button>

            <div className="text-center mt-6">
              <Link
                href="/auth/login"
                className="font-medium hover:underline"
                style={{ fontSize: '18px', color: 'var(--hw-primary, #203954)' }}
              >
                Already have an account? Sign In
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t" style={{ borderColor: 'var(--hw-border-subtle, #D2C9BD)' }}>
              <div className="flex items-center gap-2" style={{ fontSize: '14px', color: 'var(--hw-text-secondary, #4A4A4A)' }}>
                <Lock className="h-4 w-4" style={{ color: 'var(--hw-accent-gold, #CBA46A)' }} />
                <span>256-bit SSL</span>
              </div>
              <div className="flex items-center gap-2" style={{ fontSize: '14px', color: 'var(--hw-text-secondary, #4A4A4A)' }}>
                <Shield className="h-4 w-4" style={{ color: 'var(--hw-secondary, #3E6A5A)' }} />
                <span>Bank-Level Security</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
