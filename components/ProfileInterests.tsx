"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

interface Interests {
  general: string | null;
  people: string | null;
  places: string | null;
}

interface ProfileInterestsProps {
  userId: string;
  initialInterests?: Interests;
}

export function ProfileInterests({ userId, initialInterests }: ProfileInterestsProps) {
  const { toast } = useToast();
  const [interests, setInterests] = useState<Interests>({
    general: initialInterests?.general || null,
    people: initialInterests?.people || null,
    places: initialInterests?.places || null,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: keyof Interests, value: string) => {
    setInterests(prev => ({
      ...prev,
      [field]: value || null,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await apiRequest("POST", "/api/profile/interests", interests);
      
      if (response.ok) {
        toast({
          title: "✨ Interests saved!",
          description: "New personalized questions are being created for you",
        });
        
        // Invalidate prompts to fetch new personalized ones
        queryClient.invalidateQueries({ queryKey: ["/api/prompts/next"] });
        queryClient.invalidateQueries({ queryKey: ["/api/prompts/active"] });
      } else {
        throw new Error("Failed to save interests");
      }
    } catch (error) {
      toast({
        title: "Failed to save",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-amber-100 mb-6">
      <h2 className="text-xl font-serif mb-2 text-heritage-brown">
        Help Me Ask Better Questions
      </h2>
      <p className="text-gray-600 mb-4 text-sm">
        Share a few interests and I'll ask more personal questions
      </p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="general" className="block text-sm mb-1.5 text-gray-700 font-medium">
            What interests you most?
          </Label>
          <Input
            id="general"
            type="text"
            placeholder="Jazz music, woodworking, baseball, cooking..."
            value={interests.general || ''}
            onChange={(e) => handleChange('general', e.target.value)}
            className="w-full p-3 text-base border rounded-lg"
          />
        </div>

        <div>
          <Label htmlFor="people" className="block text-sm mb-1.5 text-gray-700 font-medium">
            People who matter
          </Label>
          <Input
            id="people"
            type="text"
            placeholder="My brother Tom, Mrs. Henderson, the grandkids..."
            value={interests.people || ''}
            onChange={(e) => handleChange('people', e.target.value)}
            className="w-full p-3 text-base border rounded-lg"
          />
        </div>

        <div>
          <Label htmlFor="places" className="block text-sm mb-1.5 text-gray-700 font-medium">
            Places that hold memories
          </Label>
          <Input
            id="places"
            type="text"
            placeholder="The lake house, Brooklyn, our first apartment..."
            value={interests.places || ''}
            onChange={(e) => handleChange('places', e.target.value)}
            className="w-full p-3 text-base border rounded-lg"
          />
        </div>
        
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 bg-[#D4A574] hover:bg-[#C09564] text-white rounded-lg font-medium"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save Interests"}
        </Button>
      </div>
    </div>
  );
}
