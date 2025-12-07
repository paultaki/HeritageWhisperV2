"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CustomToggle } from "@/components/ui/custom-toggle";
import { Separator } from "@/components/ui/separator";
import { Bell } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";

interface NotificationsSectionProps {
  emailNotifications: boolean;
  setEmailNotifications: (value: boolean) => void;
  weeklyDigest: boolean;
  setWeeklyDigest: (value: boolean) => void;
  familyComments: boolean;
  setFamilyComments: (value: boolean) => void;
  printedBooksNotify: boolean;
  setPrintedBooksNotify: (value: boolean) => void;
  updatePreferencesMutation: UseMutationResult<any, any, any, any>;
}

export function NotificationsSection({
  emailNotifications,
  setEmailNotifications,
  weeklyDigest,
  setWeeklyDigest,
  familyComments,
  setFamilyComments,
  printedBooksNotify,
  setPrintedBooksNotify,
  updatePreferencesMutation,
}: NotificationsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <Bell className="w-5 h-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>Manage how you receive updates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between py-2 gap-4">
          <div className="space-y-0.5 flex-1">
            <Label htmlFor="email-notifications" className="text-base font-medium">
              Email Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive important updates, new story reminders, and account notifications via email
            </p>
          </div>
          <CustomToggle
            id="email-notifications"
            checked={emailNotifications}
            onCheckedChange={(checked) => {
              setEmailNotifications(checked);
              updatePreferencesMutation.mutate({ emailNotifications: checked });
            }}
            aria-label="Toggle email notifications"
          />
        </div>

        <Separator />

        <div className="flex items-start justify-between py-2 gap-4">
          <div className="space-y-0.5 flex-1">
            <Label htmlFor="weekly-digest" className="text-base font-medium">
              Weekly Digest
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive a weekly email with your story count, new memories, and suggested prompts
            </p>
          </div>
          <CustomToggle
            id="weekly-digest"
            checked={weeklyDigest}
            onCheckedChange={(checked) => {
              setWeeklyDigest(checked);
              updatePreferencesMutation.mutate({ weeklyDigest: checked });
            }}
            aria-label="Toggle weekly digest"
          />
        </div>

        <Separator />

        <div className="flex items-start justify-between py-2 gap-4">
          <div className="space-y-0.5 flex-1">
            <Label htmlFor="family-comments" className="text-base font-medium">
              Family Comments
            </Label>
            <p className="text-sm text-muted-foreground">
              Get notified when family members add comments or reactions to your stories
            </p>
          </div>
          <CustomToggle
            id="family-comments"
            checked={familyComments}
            onCheckedChange={(checked) => {
              setFamilyComments(checked);
              updatePreferencesMutation.mutate({ familyComments: checked });
            }}
            aria-label="Toggle family comments notifications"
          />
        </div>

        <Separator />

        <div className="flex items-start justify-between py-2 gap-4">
          <div className="space-y-0.5 flex-1">
            <Label htmlFor="printed-books-notify" className="text-base font-medium">
              Printed Books Availability
            </Label>
            <p className="text-sm text-muted-foreground">
              Be the first to know when professionally printed books become available for order
            </p>
          </div>
          <CustomToggle
            id="printed-books-notify"
            checked={printedBooksNotify}
            onCheckedChange={(checked) => {
              setPrintedBooksNotify(checked);
              updatePreferencesMutation.mutate({ printedBooksNotify: checked });
            }}
            aria-label="Toggle printed books notifications"
          />
        </div>
      </CardContent>
    </Card>
  );
}
