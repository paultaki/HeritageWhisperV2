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
import { Eye, EyeOff } from "lucide-react";

const logoUrl = "/hw_logo_icon.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login, register, user } = useAuth();
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
      if (isRegistering) {
        if (!name || !birthYear) {
          toast({
            title: "All fields required",
            description: "Please enter your name and birth year to continue",
            variant: "destructive",
          });
          return;
        }
        await register(email, password, name, parseInt(birthYear));
      } else {
        await login(email, password);
      }
    } catch (error: any) {
      toast({
        title: "Authentication failed",
        description: error.message || "Please check your credentials and try again",
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
            <img src={logoUrl} alt="HeritageWhisper Logo" className="w-full h-full object-contain" />
          </div>
          <p className="text-2xl text-muted-foreground font-medium">Your voice. Their treasure. Forever.</p>
        </div>
        
        <Card className="shadow-lg border">
          <CardContent className="pt-8 pb-8 px-8">
            <h2 className="text-2xl font-semibold text-center mb-8">
              {isRegistering ? "Create Your Story" : "Welcome Back to Your Story"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-lg font-medium">Email</Label>
                <Input 
                  type="email" 
                  id="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-3 text-lg py-4"
                  placeholder="your@email.com"
                  required
                  data-testid="input-email"
                />
              </div>
              
              <div>
                <Label htmlFor="password" className="text-lg font-medium">Password</Label>
                <div className="relative mt-3">
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-lg py-4 pr-12 w-full"
                    placeholder="••••••••"
                    required
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {!isRegistering && (
                  <div className="mt-2 text-right">
                    <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                )}
              </div>
              
              {isRegistering && (
                <>
                  <div>
                    <Label htmlFor="name" className="text-lg font-medium">Full Name</Label>
                    <Input 
                      type="text" 
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-3 text-lg py-4"
                      placeholder="Your full name"
                      required
                      data-testid="input-name"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      This will appear on your timeline
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="birthYear" className="text-lg font-medium">Birth Year</Label>
                  <Input 
                    type="number" 
                    id="birthYear"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="mt-3 text-lg py-4"
                    placeholder="1952"
                    min="1920"
                    max="2010"
                    required
                    data-testid="input-birth-year"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    This helps us create your timeline
                  </p>
                  </div>
                </>
              )}
              
              <Button 
                type="submit" 
                className="w-full text-xl font-semibold py-4"
                data-testid={isRegistering ? "button-register" : "button-login"}
              >
                {isRegistering ? "Create My Timeline" : "Sign In"}
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
              className="w-full text-lg font-medium py-4 flex items-center justify-center gap-3 hover:bg-gray-50"
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
                <Button 
                  type="button" 
                  variant="link"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-primary hover:text-primary/80 text-lg font-medium"
                  data-testid="button-toggle-mode"
                >
                  {isRegistering ? "Already have an account? Sign In" : "New Here? Create Your Story"}
                </Button>
              </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
