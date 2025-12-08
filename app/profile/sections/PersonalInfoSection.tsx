"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProfilePhotoUploader } from "@/components/ProfilePhotoUploader";
import { User, Save } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";

interface PersonalInfoSectionProps {
  // Form state
  name: string;
  setName: (value: string) => void;
  email: string;
  birthYear: string;
  setBirthYear: (value: string) => void;
  birthMonth: string;
  setBirthMonth: (value: string) => void;
  birthDay: string;
  setBirthDay: (value: string) => void;
  bio: string;
  setBio: (value: string) => void;
  profilePhoto: string;
  // Handlers
  onSaveProfile: (e: React.FormEvent) => void;
  onPhotoUpdate: (photoUrl: string) => void;
  // Mutation state
  isPending: boolean;
}

export function PersonalInfoSection({
  name,
  setName,
  email,
  birthYear,
  setBirthYear,
  birthMonth,
  setBirthMonth,
  birthDay,
  setBirthDay,
  bio,
  setBio,
  profilePhoto,
  onSaveProfile,
  onPhotoUpdate,
  isPending,
}: PersonalInfoSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <User className="w-5 h-5" />
          Personal Information
        </CardTitle>
        <CardDescription>
          Update your profile photo and basic information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSaveProfile} className="space-y-6">
          {/* Profile Photo */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <ProfilePhotoUploader
              currentPhotoUrl={profilePhoto}
              onPhotoUpdate={onPhotoUpdate}
              disabled={isPending}
            />
            <div className="flex-1 pt-4">
              <h4 className="font-medium text-base mb-1">Profile Photo</h4>
              <p className="text-base text-[var(--hw-text-secondary)]">
                Click the camera icon to upload a new photo. You can zoom and reposition before saving.
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4">
            <div>
              <Label htmlFor="name" className="text-base font-medium">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 h-14 text-base"
                placeholder="Your full name"
                required
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-base font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                className="mt-2 h-14 text-base"
                disabled
                placeholder="your@email.com"
              />
              <p className="text-base text-[var(--hw-text-secondary)] mt-1">
                Email cannot be changed
              </p>
            </div>

            <div>
              <Label className="text-base font-medium">
                Birthday
              </Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div>
                  <Label htmlFor="birthMonth" className="text-sm text-[var(--hw-text-secondary)] mb-1 block">
                    Month
                  </Label>
                  <select
                    id="birthMonth"
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    className="w-full h-14 text-base rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="">--</option>
                    <option value="1">January</option>
                    <option value="2">February</option>
                    <option value="3">March</option>
                    <option value="4">April</option>
                    <option value="5">May</option>
                    <option value="6">June</option>
                    <option value="7">July</option>
                    <option value="8">August</option>
                    <option value="9">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="birthDay" className="text-sm text-[var(--hw-text-secondary)] mb-1 block">
                    Day
                  </Label>
                  <select
                    id="birthDay"
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    className="w-full h-14 text-base rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="">--</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day.toString()}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="birthYear" className="text-sm text-[var(--hw-text-secondary)] mb-1 block">
                    Year
                  </Label>
                  <Input
                    id="birthYear"
                    type="number"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className="h-14 text-base"
                    placeholder="1952"
                    min="1920"
                    max="2010"
                    required
                  />
                </div>
              </div>
              <p className="text-base text-[var(--hw-text-secondary)] mt-2">
                Your birthday is used to organize your timeline and calculate ages
              </p>
            </div>

            <div>
              <Label htmlFor="bio" className="text-base font-medium">
                About / Bio
              </Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="mt-2 min-h-[100px] text-base leading-relaxed"
                placeholder="Tell us a little about yourself..."
                maxLength={500}
              />
              <p className="text-base text-[var(--hw-text-secondary)] mt-1">
                {bio.length}/500 characters
              </p>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full min-h-[60px] text-lg font-medium bg-[var(--hw-primary)] hover:bg-[var(--hw-primary-hover)] text-white"
            disabled={isPending}
          >
            <Save className="w-5 h-5 mr-2" />
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
