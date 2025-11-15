import { Shield, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PrivacyInfoCard() {
  const privacyPoints = [
    "Only people you invite",
    "You can remove access at any time",
    "Nothing is public",
  ];

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50/50 border border-green-200 rounded-2xl overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2.5 text-xl md:text-2xl font-semibold text-gray-900 leading-tight">
          <div className="inline-flex w-10 h-10 rounded-xl bg-green-600 items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          Who can see your stories?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {privacyPoints.map((point, index) => (
          <div key={index} className="flex items-center gap-2.5">
            <div className="inline-flex w-6 h-6 rounded-full bg-green-600 items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-white" />
            </div>
            <p className="text-base md:text-lg text-gray-700 leading-snug font-medium">
              {point}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
