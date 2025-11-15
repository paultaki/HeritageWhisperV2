"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function Onboarding() {
  const [birthYear, setBirthYear] = useState("1952");
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user already has birth year, redirect to timeline
  useEffect(() => {
    if (user?.birthYear) {
      router.push("/timeline");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const year = parseInt(birthYear);

      // Validate birth year
      if (isNaN(year) || year < 1920 || year > 2010) {
        toast({
          title: "Invalid birth year",
          description: "Please enter a valid birth year between 1920 and 2010",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Update user profile with birth year
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ birthYear: year }),
      });

      if (!res.ok) {
        throw new Error("Failed to update birth year");
      }

      toast({
        title: "Welcome!",
        description: "Your timeline is ready",
      });

      // Navigate to timeline
      router.push("/timeline");
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "Failed to save birth year. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const yearDigits = birthYear.padStart(4, "0").split("");

  const updateYear = (index: number, value: string) => {
    // Only allow single digits
    if (value.length > 1) {
      value = value.slice(-1);
    }

    const newDigits = [...yearDigits];
    newDigits[index] = value;
    const newYear = newDigits.join("");

    if (newYear.length === 4) {
      setBirthYear(newYear);
    }

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.querySelector(
        `[data-testid="input-year-digit-${index + 1}"]`,
      ) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    // Handle backspace to move to previous input
    if (e.key === "Backspace" && !yearDigits[index] && index > 0) {
      const prevInput = document.querySelector(
        `[data-testid="input-year-digit-${index - 1}"]`,
      ) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
      }
    }
  };

  return (
    <div className="hw-page flex items-center justify-center p-4 album-texture">
      <div className="w-full max-w-lg text-center">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            When were you born?
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            This helps us create your timeline
          </p>
        </div>

        <Card className="shadow-lg border border-border mb-8">
          <CardContent className="pt-8 pb-8 px-6">
            <form onSubmit={handleSubmit}>
              <div className="flex justify-center items-center mb-8">
                <div className="grid grid-cols-4 gap-3">
                  {yearDigits.map((digit, index) => (
                    <Input
                      key={index}
                      type="number"
                      value={digit}
                      onChange={(e) => updateYear(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-16 h-16 md:w-20 md:h-20 text-5xl md:text-6xl font-bold text-center text-primary border-2 border-border focus:ring-2 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      min="0"
                      max="9"
                      maxLength={1}
                      data-testid={`input-year-digit-${index}`}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full text-xl font-semibold py-6"
                data-testid="button-create-timeline"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating Timeline..." : "Create My Timeline"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
