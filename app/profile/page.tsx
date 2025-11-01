"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ProfileInterests } from "@/components/ProfileInterests";
import { ProfilePhotoUploader } from "@/components/ProfilePhotoUploader";
import { Button } from "@/components/ui/button";
import { LeftSidebar } from "@/components/LeftSidebar";
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export default function Profile() {
  const router = useRouter();
  const { user, logout, session, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [showHelp, setShowHelp] = useState(false);

  // User Information
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [bio, setBio] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");

  // Account Settings
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  // Passkey setup
  const [showPasskeySetup, setShowPasskeySetup] = useState(false);
  const [passkeyPassword, setPasskeyPassword] = useState("");

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
          "Your profile has been saved successfully. Timeline updated with new birth year.",
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

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const response = await apiRequest(
        "POST",
        "/api/auth/change-password",
        data,
      );
      return response.json();
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Password change failed",
        description: error.message || "Could not update your password.",
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

    await updateProfileMutation.mutateAsync({
      name,
      birthYear: parseInt(birthYear),
      bio,
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Missing fields",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation must match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }

    await updatePasswordMutation.mutateAsync({
      currentPassword,
      newPassword,
    });
  };

  const handlePasskeySetupSuccess = () => {
    setShowPasskeySetup(false);
    setPasskeyPassword("");
    toast({
      title: "Passkey added successfully",
      description: "You can now sign in with your passkey",
    });
    // Refresh passkey list if the ManagePasskeys component is visible
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

  const handlePhotoUpdate = async (photoUrl: string) => {
    setProfilePhoto(photoUrl);
    await updateProfileMutation.mutateAsync({
      name,
      birthYear: parseInt(birthYear),
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
      <div className="min-h-screen bg-background album-texture flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-rose-50 flex flex-col overflow-x-hidden">
      {/* Desktop Header */}
      <DesktopPageHeader
        icon={User}
        title={`Welcome back, ${firstName}`}
        subtitle="Manage your account, privacy, and preferences"
        rightContent={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHelp((prev) => !prev)}
            className="text-gray-600"
            style={{ color: '#99898C' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#7C6569'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#99898C'}
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        }
      />

      {/* Mobile Header */}
      <MobilePageHeader
        icon={User}
        title={`Welcome, ${firstName}`}
        subtitle="Manage your account"
        leftContent={
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 md:hidden"
                style={{ color: '#99898C' }}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <LeftSidebar />
            </SheetContent>
          </Sheet>
        }
        rightContent={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHelp((prev) => !prev)}
            className="text-gray-600"
            style={{ color: '#99898C' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#7C6569'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#99898C'}
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
            className="border-b"
            style={{ backgroundColor: '#F9E5E8', borderColor: '#E0D9D7' }}
          >
            <div className="max-w-6xl mx-auto px-4 md:px-6 py-4" style={{ color: '#7C6569' }}>
              <h3 className="font-semibold text-lg mb-2">Need a hand?</h3>
              <ul className="space-y-1 text-base">
                <li>• Update your photo, bio, and contact preferences here.</li>
                <li>• Toggle AI features if you want manual-only storytelling.</li>
                <li>• Export your entire archive or print-ready book PDFs.</li>
                <li>• Scroll to the bottom for account deletion and logout.</li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 w-full overflow-x-visible">
        {isDesktop && <LeftSidebar />}

        {/* Main content - centered */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0 overflow-x-visible">
          <div className="max-w-3xl px-4 md:px-6 py-6 md:py-8" style={{ marginLeft: 0, marginRight: "auto" }}>
        {/* Profile Interests - Help personalize prompts */}
        {user && (
          <ProfileInterests
            userId={user.id}
            initialInterests={(profileData as any)?.user?.profile_interests}
          />
        )}

        <div className="space-y-8">
          {/* Profile Photo & Basic Info */}
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
              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Profile Photo */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                  <ProfilePhotoUploader
                    currentPhotoUrl={profilePhoto}
                    onPhotoUpdate={handlePhotoUpdate}
                    disabled={updateProfileMutation.isPending}
                  />
                  <div className="flex-1 pt-4">
                    <h4 className="font-medium mb-1">Profile Photo</h4>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Click the camera icon to upload a new photo. You can zoom and reposition before saving.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="name" className="text-base">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-2 h-12 text-base"
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-base">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      className="mt-2 h-12 text-base"
                      disabled
                      placeholder="your@email.com"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Email cannot be changed
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="birthYear" className="text-base">
                      Birth Year
                    </Label>
                    <Input
                      id="birthYear"
                      type="number"
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      className="mt-2 h-12 text-base"
                      placeholder="1952"
                      min="1920"
                      max="2010"
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Used to organize your timeline
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="bio" className="text-base">
                      About / Bio
                    </Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="mt-2 min-h-[100px] text-base"
                      placeholder="Tell us a little about yourself..."
                      maxLength={500}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      {bio.length}/500 characters
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  style={{ backgroundColor: '#7C6569', color: 'white' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#9C7280'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7C6569'}
                  disabled={updateProfileMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateProfileMutation.isPending
                    ? "Saving..."
                    : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Subscription & Storage */}
          {user.isPaid !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  {user.isPaid ? "Premium Plan" : "Free Plan"}
                </CardTitle>
                <CardDescription>
                  {user.isPaid
                    ? "Thank you for being a premium member!"
                    : "Upgrade to unlock more storage and features"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Storage Used</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {storageUsedGB} GB / {storageLimitGB} GB
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="rounded-full h-2 transition-all"
                      style={{
                        width: `${storagePercent}%`,
                        backgroundColor: '#7C6569'
                      }}
                    />
                  </div>
                </div>

                {!user.isPaid && (
                  <Button
                    className="w-full h-12"
                    variant="default"
                    style={{ backgroundColor: '#7C6569', color: 'white' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#9C7280'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7C6569'}
                  >
                    <ArrowUpCircle className="w-4 h-4 mr-2" />
                    Upgrade to Premium
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <Lock className="w-5 h-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword" className="text-base">
                    Current Password
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-2 h-12 text-base"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <Label htmlFor="newPassword" className="text-base">
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-2 h-12 text-base"
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-base">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-2 h-12 text-base"
                    placeholder="Confirm new password"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  style={{ backgroundColor: '#7C6569', color: 'white' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#9C7280'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7C6569'}
                  disabled={updatePasswordMutation.isPending}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {updatePasswordMutation.isPending
                    ? "Updating..."
                    : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Passkey Management */}
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
                className="w-full h-12 text-base"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
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
                      <Label htmlFor="passkey-password" className="text-base">
                        Current Password
                      </Label>
                      <Input
                        id="passkey-password"
                        type="password"
                        value={passkeyPassword}
                        onChange={(e) => setPasskeyPassword(e.target.value)}
                        className="mt-2 h-12 text-base"
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

          {/* Notification Settings */}
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

          {/* Privacy Settings */}
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

          {/* Heritage Whisper Storyteller Settings */}
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
                    When enabled, AI transcribes your recordings. When disabled, you can still type stories manually.
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
                  className="w-full h-12 text-base justify-start"
                  onClick={handleExportData}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export All Data (JSON)
                </Button>
                <p className="text-sm text-muted-foreground mt-2 px-1">
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

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full h-12 text-base justify-start"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
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
                        <Label htmlFor="delete-confirmation" className="text-sm font-medium">
                          Type <span className="font-bold text-red-600">DELETE</span> to confirm:
                        </Label>
                        <Input
                          id="delete-confirmation"
                          type="text"
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          placeholder="Type DELETE"
                          className="mt-2"
                          autoComplete="off"
                        />
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel 
                      className="h-12"
                      onClick={() => setDeleteConfirmation("")}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmation !== "DELETE"}
                      className="h-12 bg-destructive hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete Account Permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* Logout Button */}
          <div className="pt-2">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full h-12 text-base"
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
