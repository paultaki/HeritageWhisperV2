"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { signInWithGoogle } from "@/lib/supabase";
import { Eye, EyeOff, Mail, Lock, LogIn } from "lucide-react";

const logoUrl = "/HW_text-compress.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login, user } = useAuth();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/timeline");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login(email, password);
    } catch (error: any) {
      toast({
        title: "Authentication failed",
        description:
          error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 album-texture">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          {/* Heritage Whisper Logo */}
          <div
            className="w-40 h-40 mx-auto mb-8 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => router.push("/")}
          >
            <img
              src={logoUrl}
              alt="HeritageWhisper Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-2xl text-muted-foreground font-medium text-center">
            Your voice. Their treasure. Forever.
          </p>
        </div>

        <Card className="shadow-lg border">
          <CardContent className="pt-8 pb-8 px-8">
            <h2 className="text-2xl font-semibold text-center mb-8">
              Welcome Back to Your Story
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-lg font-medium text-foreground">
                  Email
                </Label>
                <div className="relative mt-3">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Mail className="h-5 w-5" />
                  </div>
                  <Input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="text-lg py-4 pl-10"
                    placeholder="your@email.com"
                    required
                    autoComplete="email"
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-lg font-medium text-foreground">
                  Password
                </Label>
                <div className="mt-3 flex items-center gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                      <Lock className="h-5 w-5" />
                    </div>
                    <Input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSubmit(e as any);
                        }
                      }}
                      className="text-lg py-4 pl-10 pr-12 w-full"
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      data-testid="input-password"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 transition-colors"
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
                <div className="mt-2 text-right">
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-gray-700 hover:text-gray-900 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                className="relative w-full text-xl font-semibold py-4 transition-all duration-300 overflow-hidden flex items-center justify-center gap-2 group hover:shadow-[0_0_0_1px_rgba(245,158,11,0.35),0_20px_40px_rgba(245,158,11,0.18)]"
                data-testid="button-login"
              >
                <LogIn className="h-5 w-5 relative z-[1] group-hover:translate-x-1 transition-transform duration-300" />
                <span className="relative z-[1] group-hover:translate-x-1 transition-transform duration-300">
                  Sign In
                </span>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-300"
                  style={{
                    background:
                      "linear-gradient(45deg, rgba(245,158,11,0.8) 0%, rgba(251,146,60,0.8) 50%, rgba(251,113,133,0.8) 100%)",
                  }}
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-md"
                  style={{
                    background:
                      "radial-gradient(120% 80% at 50% -20%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.03) 55%, rgba(255,255,255,0) 60%)",
                  }}
                />
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-3 text-gray-500">Or</span>
              </div>
            </div>

            {/* Google Sign-in Button */}
            <Button
              type="button"
              onClick={signInWithGoogle}
              variant="outline"
              className="w-full text-lg font-medium py-4 flex items-center justify-center gap-3 transition-all duration-300 hover:bg-gray-50 hover:shadow-md"
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
              <Link href="/auth/register">
                <Button
                  type="button"
                  variant="link"
                  className="text-gray-700 hover:text-gray-900 text-lg font-medium"
                  data-testid="button-create-story"
                >
                  New Here? Create Your Story
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
