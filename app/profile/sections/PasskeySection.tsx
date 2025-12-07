"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Fingerprint, Plus } from "lucide-react";
import { PasskeyAuth } from "@/components/auth/PasskeyAuth";
import { ManagePasskeys } from "@/components/auth/ManagePasskeys";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface PasskeySectionProps {
  email: string;
}

export function PasskeySection({ email }: PasskeySectionProps) {
  const { toast } = useToast();
  const [showPasskeySetup, setShowPasskeySetup] = useState(false);
  const [passkeyPassword, setPasskeyPassword] = useState("");

  const handlePasskeySetupSuccess = () => {
    setShowPasskeySetup(false);
    setPasskeyPassword("");
    toast({
      title: "Passkey added successfully",
      description: "You can now sign in with your passkey",
    });
    // Refresh passkey list
    queryClient.invalidateQueries({ queryKey: ["passkeys"] });
  };

  const handlePasskeySetupError = (error: string) => {
    toast({
      title: "Failed to set up passkey",
      description: error,
      variant: "destructive",
    });
  };

  const handlePasskeyDialogClose = (open: boolean) => {
    setShowPasskeySetup(open);
    if (!open) {
      setPasskeyPassword("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <Fingerprint className="w-5 h-5" />
          Passkeys
        </CardTitle>
        <CardDescription>
          Sign in faster and more securely with your fingerprint, face, or security key
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>What are passkeys?</strong> Passkeys let you sign in using your device's built-in security
            like Touch ID, Face ID, or Windows Hello. They're more secure than passwords and you never have to remember them.
          </p>
        </div>

        <ManagePasskeys />

        <Button
          type="button"
          onClick={() => setShowPasskeySetup(true)}
          className="w-full min-h-[48px] text-base font-medium"
          variant="outline"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Passkey
        </Button>

        {/* Passkey Setup Dialog */}
        <AlertDialog open={showPasskeySetup} onOpenChange={handlePasskeyDialogClose}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Set up a new passkey</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                To verify it's you, please enter your current password first.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <Label htmlFor="passkey-password" className="text-base font-medium">
                  Current Password
                </Label>
                <Input
                  id="passkey-password"
                  type="password"
                  value={passkeyPassword}
                  onChange={(e) => setPasskeyPassword(e.target.value)}
                  className="mt-2 h-14 text-base"
                  placeholder="Enter your password"
                />
              </div>

              {passkeyPassword && (
                <PasskeyAuth
                  mode="register"
                  email={email}
                  password={passkeyPassword}
                  onSuccess={handlePasskeySetupSuccess}
                  onError={handlePasskeySetupError}
                />
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
