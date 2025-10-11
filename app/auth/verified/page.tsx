"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function AuthVerified() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    // Check URL parameters for verification status
    const url = new URL(window.location.href);
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    if (error) {
      setStatus("error");
      setMessage(
        errorDescription ||
          "Email verification failed. The link may have expired.",
      );
    } else {
      setStatus("success");
      setMessage("Your email has been verified successfully!");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center album-texture px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === "loading" && (
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            )}
            {status === "success" && (
              <CheckCircle className="h-12 w-12 text-green-600" />
            )}
            {status === "error" && (
              <XCircle className="h-12 w-12 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === "loading" && "Verifying Email"}
            {status === "success" && "Email Verified!"}
            {status === "error" && "Verification Failed"}
          </CardTitle>
          <CardDescription className="mt-2">{message}</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === "success" && (
            <>
              <p className="text-sm text-gray-600">
                You can now sign in to your Heritage Whisper account and start
                sharing your stories.
              </p>
              <Button
                onClick={() => router.push("/auth/login")}
                className="w-full"
                size="lg"
              >
                Continue to Sign In
              </Button>
            </>
          )}
          {status === "error" && (
            <>
              <p className="text-sm text-gray-600">
                Please try requesting a new verification email or contact
                support if the problem persists.
              </p>
              <div className="space-y-2">
                <Button
                  onClick={() => router.push("/auth/login")}
                  className="w-full"
                  size="lg"
                >
                  Back to Sign In
                </Button>
                <Button
                  onClick={() => router.push("/auth/register")}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Try Registering Again
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
