"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CustomToggle } from "@/components/ui/custom-toggle";
import { Brain } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";

interface AISettingsSectionProps {
  aiProcessingEnabled: boolean;
  setAiProcessingEnabled: (value: boolean) => void;
  updateAIConsentMutation: UseMutationResult<any, any, boolean, any>;
}

export function AISettingsSection({
  aiProcessingEnabled,
  setAiProcessingEnabled,
  updateAIConsentMutation,
}: AISettingsSectionProps) {
  return (
    <Card id="ai-processing">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <Brain className="w-5 h-5" />
          Heritage Whisper Storyteller
        </CardTitle>
        <CardDescription>
          Enable Storyteller features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between py-2 gap-4">
          <div className="space-y-0.5 flex-1">
            <Label htmlFor="ai-processing" className="text-base font-medium">
              Enable Storyteller Features
            </Label>
            <p className="text-sm text-muted-foreground">
              When enabled, Whisper Storyteller transcribes your recordings. When disabled, you can still type stories manually.
            </p>
            <div className="mt-3 pt-2 border-t">
              <p className="text-sm font-medium text-gray-700 mb-2">What happens when disabled:</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>Recording features will be unavailable</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>No Storyteller-generated prompts or follow-up questions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span>You can still type stories and use all other features</span>
                </li>
              </ul>
            </div>
          </div>
          <CustomToggle
            id="ai-processing"
            checked={aiProcessingEnabled}
            onCheckedChange={(checked) => {
              setAiProcessingEnabled(checked);
              updateAIConsentMutation.mutate(checked);
            }}
            aria-label="Toggle Storyteller features"
          />
        </div>
      </CardContent>
    </Card>
  );
}
