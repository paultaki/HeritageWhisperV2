"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setMessage("Check your email for the password reset link!");
      setEmail("");
    } catch (error: any) {
      setError(error.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-album-cream to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card className="border-heritage-gold/20">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-heritage-brown">
              Reset Your Password
            </CardTitle>
            <CardDescription className="text-center text-heritage-brown/70">
              Enter your email address and we'll send you a link to reset your
              password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-heritage-brown">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-heritage-brown/50" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10 border-heritage-gold/30 focus:border-heritage-gold"
                  />
                </div>
              </div>

              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {message && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800">
                    {message}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={loading || !email}
                className="relative w-full text-white text-lg font-semibold py-6 transition-all duration-300 overflow-hidden flex items-center justify-center gap-2 group hover:shadow-[0_0_0_1px_rgba(245,158,11,0.35),0_20px_40px_rgba(245,158,11,0.18)]"
              >
                <Send className="h-5 w-5 relative z-[1] group-hover:translate-x-1 transition-transform duration-300" />
                <span className="relative z-[1] group-hover:translate-x-1 transition-transform duration-300">
                  {loading ? "Sending..." : "Send Reset Link"}
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
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Link
              href="/auth/login"
              className="inline-flex items-center text-sm text-heritage-blue hover:text-heritage-blue/80 transition-colors"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
