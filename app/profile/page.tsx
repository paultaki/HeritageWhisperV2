"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ProfileInterests } from "@/components/ProfileInterests";
import { ProfilePhotoUploader } from "@/components/ProfilePhotoUploader";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CustomToggle } from "@/components/ui/custom-toggle";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  User,
  Save,
  Camera,
  Lock,
  Bell,
  Eye,
  CreditCard,
  HardDrive,
  ArrowUpCircle,
  AlertTriangle,
  Download,
  Trash2,
  FileText,
  Sparkles,
  Brain,
  HelpCircle,
  Fingerprint,
  Plus,
} from "lucide-react";
import { PasskeyAuth } from "@/components/auth/PasskeyAuth";
import { ManagePasskeys } from "@/components/auth/ManagePasskeys";
import { DesktopPageHeader, MobilePageHeader } from "@/components/PageHeader";
import { useSubscription } from "@/hooks/use-subscription";
import { Badge } from "@/components/ui/badge";
import { NotificationsSection, PrivacySection, AISettingsSection, PasswordSection, PasskeySection, PersonalInfoSection, MembershipSection } from "./sections";

export default function Profile() {
  const router = useRouter();
  const { user, logout, session, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const { isPaid, planType } = useSubscription();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [showHelp, setShowHelp] = useState(false);

  // User Information
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [bio, setBio] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");

  // Account Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [familyComments, setFamilyComments] = useState(true);
  const [printedBooksNotify, setPrintedBooksNotify] = useState(false);
  const [defaultStoryVisibility, setDefaultStoryVisibility] = useState(true);
  const [aiProcessingEnabled, setAiProcessingEnabled] = useState(true);

  // PDF Export
  const [isExporting, setIsExporting] = useState(false);

  // Delete account confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  // Redirect to login if not authenticated (but wait for loading to finish)
  useEffect(() => {
  if (!isAuthLoading && !user) {
    router.push("/auth/login");
  } else if (user) {
    setName(user.name || "");
    setEmail(user.email || "");
    setBirthYear(user.birthYear?.toString() || "");
  }
}, [user, isAuthLoading, router]);

  // Fetch profile data
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["/api/user/profile"],
    enabled: !!user,
  });

  // Populate birthday fields from profile data
  useEffect(() => {
    if ((profileData as any)?.user?.birthDate) {
      // Parse birthDate (YYYY-MM-DD format)
      const [year, month, day] = (profileData as any).user.birthDate.split("-");
      if (year) setBirthYear(year);
      if (month) setBirthMonth(month);
      if (day) setBirthDay(day);
    } else if ((profileData as any)?.user?.birthYear) {
      // Fall back to just year if no full date
      setBirthYear((profileData as any).user.birthYear.toString());
    }
  }, [profileData]);

  // Fetch AI consent status
  const { data: aiConsentData } = useQuery({
    queryKey: ["/api/user/ai-settings"],
    enabled: !!user,
    retry: false,
  });

  // Populate form fields from loaded profile data
  useEffect(() => {
    if ((profileData as any)?.user) {
      const profile = (profileData as any).user;
      setBio(profile.bio || "");
      setProfilePhoto(profile.profilePhotoUrl || "");
      setEmailNotifications(profile.emailNotifications ?? true);
      setWeeklyDigest(profile.weeklyDigest ?? true);
      setFamilyComments(profile.familyComments ?? true);
      setPrintedBooksNotify(profile.printedBooksNotify ?? false);
      setDefaultStoryVisibility(profile.defaultStoryVisibility ?? true);
    }
  }, [profileData]);

  // Populate AI consent from API
  useEffect(() => {
    if (aiConsentData) {
      setAiProcessingEnabled((aiConsentData as any).ai_processing_enabled ?? true);
    }
  }, [aiConsentData]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      birthYear: number;
      birthDate?: string; // Full birthday (YYYY-MM-DD)
      bio?: string;
      profilePhotoUrl?: string;
    }) => {
      const response = await apiRequest("PATCH", "/api/user/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] }); // Refresh timeline to update birth year marker
      toast({
        title: "Profile updated",
        description:
          "Your profile has been saved successfully. Timeline updated with new birthday.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Could not update your profile.",
        variant: "destructive",
      });
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: {
      emailNotifications?: boolean;
      weeklyDigest?: boolean;
      familyComments?: boolean;
      printedBooksNotify?: boolean;
      defaultStoryVisibility?: boolean;
    }) => {
      const response = await apiRequest("PATCH", "/api/user/profile", data);
      return response.json();
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Could not update your preferences.",
        variant: "destructive",
      });
    },
  });

  const updateAIConsentMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await apiRequest("PUT", "/api/user/ai-settings", {
        ai_processing_enabled: enabled,
      });
      return response.json();
    },
    onSuccess: (data, enabled) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/ai-settings"] });
      toast({
        title: enabled ? "Storyteller Features Enabled" : "Storyteller Features Disabled",
        description: enabled
          ? "Storyteller features are now active. You can record and get personalized prompts."
          : "Storyteller features are disabled. You can still type stories manually.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Could not update AI settings.",
        variant: "destructive",
      });
      // Revert the toggle on error
      setAiProcessingEnabled(!aiProcessingEnabled);
    },
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !birthYear) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Build birthDate string if month and day are provided
    let birthDate: string | undefined;
    if (birthMonth && birthDay && birthYear) {
      // Pad month and day with leading zeros
      const paddedMonth = birthMonth.padStart(2, "0");
      const paddedDay = birthDay.padStart(2, "0");
      birthDate = `${birthYear}-${paddedMonth}-${paddedDay}`;
    }

    await updateProfileMutation.mutateAsync({
      name,
      birthYear: parseInt(birthYear),
      birthDate,
      bio,
    });
  };

  const handlePhotoUpdate = async (photoUrl: string) => {
    setProfilePhoto(photoUrl);
    // Build birthDate string if month and day are provided
    let birthDate: string | undefined;
    if (birthMonth && birthDay && birthYear) {
      const paddedMonth = birthMonth.padStart(2, "0");
      const paddedDay = birthDay.padStart(2, "0");
      birthDate = `${birthYear}-${paddedMonth}-${paddedDay}`;
    }
    await updateProfileMutation.mutateAsync({
      name,
      birthYear: parseInt(birthYear),
      birthDate,
      bio,
      profilePhotoUrl: photoUrl,
    });
  };

  const handleExportData = async () => {
    try {
      toast({
        title: "Exporting data",
        description: "Your data export is being prepared...",
      });

      const response = await apiRequest("GET", "/api/user/export");

      // Handle rate limit error (429)
      if (response.status === 429) {
        const errorData = await response.json();
        const hoursRemaining = errorData.retry_after_hours || 24;
        toast({
          title: "Export limit reached",
          description: `You can only export your data once every 24 hours. Please try again in ${hoursRemaining} hours.`,
          variant: "destructive",
        });
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      // Download the JSON file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `heritagewhisper-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export complete",
        description: "Your data has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Could not export your data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = async (format: "2up" | "trim") => {
    setIsExporting(true);
    try {
      toast({
        title: "Generating PDF",
        description: "This may take up to 60 seconds...",
      });

      const response = await apiRequest("POST", `/api/export/${format}`, {
        bookId: null, // Not used, but API expects it
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || "Failed to generate PDF");
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `heritage-book-${format}-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "PDF ready",
        description: "Your book has been downloaded successfully.",
      });
    } catch (error) {
      console.error("PDF export error:", error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Could not generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await apiRequest("DELETE", "/api/user/delete");

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      toast({
        title: "Account deleted",
        description: "Your account and all data have been permanently deleted.",
        variant: "destructive",
      });

      // Logout after 2 seconds
      setTimeout(() => {
        logout();
        router.push("/");
      }, 2000);
    } catch (error) {
      toast({
        title: "Deletion failed",
        description:
          "Could not delete your account. Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Show loading state while checking authentication
  if (isAuthLoading) {
    return (
      <div className="hw-page bg-background album-texture flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Calculate storage used (mock data for now)
  const totalStories = user.storyCount || 0;
  const storageUsedMB = Math.round(totalStories * 2.5 + totalStories * 0.5); // Avg 2.5MB audio + 0.5MB photos
  const storageUsedGB = (storageUsedMB / 1024).toFixed(2);
  const storageLimitGB = user.isPaid ? 50 : 5;
  const storagePercent = Math.min(
    (parseFloat(storageUsedGB) / storageLimitGB) * 100,
    100,
  );

  const firstName =
    user.name?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "Friend";

  return (
    <div className="hw-page bg-[var(--hw-page-bg)] flex flex-col overflow-x-hidden">
      {/* Desktop Header */}
      <DesktopPageHeader
        title={`Welcome back, ${firstName}`}
        subtitle="Manage your account, privacy, and preferences"
        rightContent={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHelp((prev) => !prev)}
            className="text-[var(--hw-text-secondary)] hover:text-[var(--hw-text-primary)] min-h-[48px] min-w-[48px]"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        }
      />

      {/* Mobile Header */}
      <MobilePageHeader
        title={`Welcome, ${firstName}`}
        subtitle="Manage your account"
        rightContent={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHelp((prev) => !prev)}
            className="text-[var(--hw-text-secondary)] hover:text-[var(--hw-text-primary)] min-h-[48px] min-w-[48px]"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        }
      />

      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="border-b bg-[var(--hw-warning-bg)] border-[var(--hw-border-subtle)]"
          >
            <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 text-[var(--hw-text-primary)]">
              <h3 className="font-semibold text-lg mb-2">Need a hand?</h3>
              <ul className="space-y-1 text-base leading-relaxed">
                <li>• Update your photo, bio, and contact preferences here.</li>
                <li>• Toggle Whisper Storyteller features if you want manual-only storytelling.</li>
                <li>• Export your entire archive or print-ready book PDFs.</li>
                <li>• Scroll to the bottom for account deletion and logout.</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 w-full overflow-x-visible">
        {/* Main content - centered */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0 overflow-x-visible">
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Profile Interests - Help personalize prompts */}
        {user && (
          <ProfileInterests
            userId={user.id}
            initialInterests={(profileData as any)?.user?.profile_interests}
          />
        )}

        <div className="space-y-8">
          {/* Profile Photo & Basic Info */}
          <PersonalInfoSection
            name={name}
            setName={setName}
            email={email}
            birthYear={birthYear}
            setBirthYear={setBirthYear}
            birthMonth={birthMonth}
            setBirthMonth={setBirthMonth}
            birthDay={birthDay}
            setBirthDay={setBirthDay}
            bio={bio}
            setBio={setBio}
            profilePhoto={profilePhoto}
            onSaveProfile={handleSaveProfile}
            onPhotoUpdate={handlePhotoUpdate}
            isPending={updateProfileMutation.isPending}
          />

          {/* Subscription & Storage */}
          {user.isPaid !== undefined && (
            <MembershipSection
              isPaid={isPaid}
              storageUsedGB={storageUsedGB}
              storageLimitGB={storageLimitGB}
              storagePercent={storagePercent}
              sessionToken={session?.access_token}
            />
          )}

          {/* Password Change */}
          <PasswordSection />

          {/* Passkey Management */}
          <PasskeySection email={email} />

          {/* Notification Settings */}
          <NotificationsSection
            emailNotifications={emailNotifications}
            setEmailNotifications={setEmailNotifications}
            weeklyDigest={weeklyDigest}
            setWeeklyDigest={setWeeklyDigest}
            familyComments={familyComments}
            setFamilyComments={setFamilyComments}
            printedBooksNotify={printedBooksNotify}
            setPrintedBooksNotify={setPrintedBooksNotify}
            updatePreferencesMutation={updatePreferencesMutation}
          />

          {/* Privacy Settings */}
          <PrivacySection
            defaultStoryVisibility={defaultStoryVisibility}
            setDefaultStoryVisibility={setDefaultStoryVisibility}
            updatePreferencesMutation={updatePreferencesMutation}
          />

          {/* Heritage Whisper Storyteller Settings */}
          <AISettingsSection
            aiProcessingEnabled={aiProcessingEnabled}
            setAiProcessingEnabled={setAiProcessingEnabled}
            updateAIConsentMutation={updateAIConsentMutation}
          />

          {/* Data & Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <HardDrive className="w-5 h-5" />
                Data & Privacy
              </CardTitle>
              <CardDescription>
                Download and manage your personal data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Export All Data */}
              <div>
                <Button
                  variant="outline"
                  className="w-full min-h-[48px] text-base font-medium justify-start"
                  onClick={handleExportData}
                >
                  <Download className="w-5 h-5 mr-2" />
                  Export All Data (JSON)
                </Button>
                <p className="text-base text-[var(--hw-text-secondary)] mt-2 px-1">
                  Download a complete copy of your stories, photos, and profile data in JSON format
                </p>
              </div>

              {/* PDF Export feature hidden - keeping functionality for future use */}
              {/* <Separator />

              <div>
                <h3 className="text-base font-semibold mb-3">Export as PDF Book</h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full h-12 text-base justify-start"
                    onClick={() => handleExportPDF("2up")}
                    disabled={isExporting}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {isExporting ? "Exporting..." : "2-Up PDF (Home Print)"}
                  </Button>
                  <p className="text-sm text-muted-foreground px-1">
                    Two 5.5×8.5" pages on Letter landscape for home printing
                  </p>

                  <Button
                    variant="outline"
                    className="w-full h-12 text-base justify-start"
                    onClick={() => handleExportPDF("trim")}
                    disabled={isExporting}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {isExporting ? "Exporting..." : "Trim PDF (Professional)"}
                  </Button>
                  <p className="text-sm text-muted-foreground px-1">
                    Individual 5.5×8.5" pages for professional printing services
                  </p>
                </div>
              </div> */}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive text-lg font-bold">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-destructive/80">
                ⚠️ Irreversible actions that cannot be undone
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-center">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-auto min-h-[48px] px-8 text-base font-medium"
                    >
                      <Trash2 className="w-5 h-5 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete Account Permanently?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-4">
                      <p className="text-red-600 font-semibold">
                        ⚠️ This action cannot be undone!
                      </p>
                      <p>
                        This will permanently delete your account and remove all your data from our servers, including:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>All your stories and recordings</li>
                        <li>All photos and memories</li>
                        <li>Your profile and settings</li>
                        <li>All family connections</li>
                      </ul>
                      <div className="pt-4">
                        <Label htmlFor="delete-confirmation" className="text-base font-medium">
                          Type <span className="font-bold text-red-600">DELETE</span> to confirm:
                        </Label>
                        <Input
                          id="delete-confirmation"
                          type="text"
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          placeholder="Type DELETE"
                          className="mt-2 h-14"
                          autoComplete="off"
                        />
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      className="min-h-[48px] font-medium"
                      onClick={() => setDeleteConfirmation("")}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmation !== "DELETE"}
                      className="min-h-[48px] font-medium bg-destructive hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete Account Permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* Logout Button */}
          <div className="pt-2">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full min-h-[48px] text-base font-medium"
            >
              Sign Out
            </Button>
          </div>
        </div>
          </div>
        </main>
      </div>
    </div>
  );
}
