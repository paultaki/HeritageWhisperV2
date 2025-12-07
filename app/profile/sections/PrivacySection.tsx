"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CustomToggle } from "@/components/ui/custom-toggle";
import { Eye } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";

interface PrivacySectionProps {
  defaultStoryVisibility: boolean;
  setDefaultStoryVisibility: (value: boolean) => void;
  updatePreferencesMutation: UseMutationResult<any, any, any, any>;
}

export function PrivacySection({
  defaultStoryVisibility,
  setDefaultStoryVisibility,
  updatePreferencesMutation,
}: PrivacySectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <Eye className="w-5 h-5" />
          Privacy Settings
        </CardTitle>
        <CardDescription>
          Control who can see your stories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between py-2 gap-4">
          <div className="space-y-0.5 flex-1">
            <Label htmlFor="default-visibility" className="text-base font-medium">
              Share New Stories with Family
            </Label>
            <p className="text-sm text-muted-foreground">
              When enabled, new stories automatically appear in your family's timeline. You can change this per story.
            </p>
          </div>
          <CustomToggle
            id="default-visibility"
            checked={defaultStoryVisibility}
            onCheckedChange={(checked) => {
              setDefaultStoryVisibility(checked);
              updatePreferencesMutation.mutate({ defaultStoryVisibility: checked });
            }}
            aria-label="Toggle default story visibility"
          />
        </div>
      </CardContent>
    </Card>
  );
}
