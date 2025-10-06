"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  ArrowLeft,
  User,
  Save,
  Camera,
  Lock,
  Bell,
  Eye,
  BarChart3,
  Clock,
  Share2,
  Users,
  CreditCard,
  HardDrive,
  ArrowUpCircle,
  AlertTriangle,
  Download,
  Trash2
} from "lucide-react";

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { toast } = useToast();

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
  const [defaultStoryVisibility, setDefaultStoryVisibility] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
    } else {
      setName(user.name || "");
      setEmail(user.email || "");
      setBirthYear(user.birthYear?.toString() || "");
    }
  }, [user, router]);

  // Fetch profile data
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  // Fetch story statistics
  const { data: storyStats } = useQuery({
    queryKey: ["/api/stories/stats"],
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; birthYear: number; bio?: string }) => {
      const response = await apiRequest("PATCH", "/api/user/profile", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] }); // Refresh timeline to update birth year marker
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully. Timeline updated with new birth year.",
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
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiRequest("POST", "/api/auth/change-password", data);
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In production, upload to Supabase Storage
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
        toast({
          title: "Photo uploaded",
          description: "Your profile photo has been updated.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportData = async () => {
    try {
      toast({
        title: "Exporting data",
        description: "Your data export is being prepared...",
      });

      const response = await apiRequest("GET", "/api/user/export");

      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      // Download the JSON file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `heritagewhisper-data-export-${new Date().toISOString().split('T')[0]}.json`;
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
        description: "Could not delete your account. Please try again or contact support.",
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

  if (!user) {
    return null;
  }

  // Calculate stats
  const totalStories = user.storyCount || 0;
  const totalRecordingMinutes = Math.round((storyStats?.totalSeconds || 0) / 60);
  const storiesShared = storyStats?.sharedCount || 0;
  const familyMembers = storyStats?.familyMembers || 0;

  // Calculate storage used (mock data for now)
  const storageUsedMB = Math.round((totalStories * 2.5) + (totalStories * 0.5)); // Avg 2.5MB audio + 0.5MB photos
  const storageUsedGB = (storageUsedMB / 1024).toFixed(2);
  const storageLimitGB = user.isPaid ? 50 : 5;
  const storagePercent = Math.min((parseFloat(storageUsedGB) / storageLimitGB) * 100, 100);

  return (
    <div className="min-h-screen bg-background album-texture pb-20 md:pb-0">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center space-x-3 md:space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/timeline")}
              className="p-2"
              size="icon"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Profile Settings</h1>
              <p className="text-sm md:text-base text-muted-foreground">Manage your account and preferences</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Profile Photo & Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
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
                  <Avatar className="w-20 h-20 md:w-24 md:h-24">
                    <AvatarImage src={profilePhoto} alt={name} />
                    <AvatarFallback className="text-2xl bg-coral-100 text-coral-600">
                      {name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Label htmlFor="photo-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors w-fit">
                        <Camera className="w-4 h-4" />
                        <span className="text-sm font-medium">Change Photo</span>
                      </div>
                      <Input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </Label>
                    <p className="text-xs md:text-sm text-muted-foreground mt-2">
                      Upload a profile photo (JPG, PNG, max 5MB)
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="name" className="text-base">Full Name</Label>
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
                    <Label htmlFor="email" className="text-base">Email</Label>
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
                    <Label htmlFor="birthYear" className="text-base">Birth Year</Label>
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
                    <Label htmlFor="bio" className="text-base">About / Bio</Label>
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
                  disabled={updateProfileMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Story Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Your Story Statistics
              </CardTitle>
              <CardDescription>
                Track your storytelling journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-sm">Total Stories</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{totalStories}</p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Recording Time</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{totalRecordingMinutes}<span className="text-lg text-muted-foreground ml-1">min</span></p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm">Shared Stories</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{storiesShared}</p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Family Members</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{familyMembers}</p>
                </div>
              </div>
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
                  {user.isPaid ? "Thank you for being a premium member!" : "Upgrade to unlock more storage and features"}
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
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${storagePercent}%` }}
                    />
                  </div>
                </div>

                {!user.isPaid && (
                  <Button className="w-full h-12" variant="default">
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
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your account password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword" className="text-base">Current Password</Label>
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
                  <Label htmlFor="newPassword" className="text-base">New Password</Label>
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
                  <Label htmlFor="confirmPassword" className="text-base">Confirm New Password</Label>
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
                  disabled={updatePasswordMutation.isPending}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Manage how you receive updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications" className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label htmlFor="weekly-digest" className="text-base">Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">Get a weekly summary of your stories</p>
                </div>
                <Switch
                  id="weekly-digest"
                  checked={weeklyDigest}
                  onCheckedChange={setWeeklyDigest}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label htmlFor="family-comments" className="text-base">Family Comments</Label>
                  <p className="text-sm text-muted-foreground">Notify when family comments on stories</p>
                </div>
                <Switch
                  id="family-comments"
                  checked={familyComments}
                  onCheckedChange={setFamilyComments}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Privacy Settings
              </CardTitle>
              <CardDescription>
                Control who can see your stories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label htmlFor="default-visibility" className="text-base">Share New Stories with Family</Label>
                  <p className="text-sm text-muted-foreground">
                    New stories will be visible to family members by default
                  </p>
                </div>
                <Switch
                  id="default-visibility"
                  checked={defaultStoryVisibility}
                  onCheckedChange={setDefaultStoryVisibility}
                />
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions - proceed with caution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-12 text-base justify-start"
                onClick={handleExportData}
              >
                <Download className="w-4 h-4 mr-2" />
                Export All Data
              </Button>

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
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account
                      and remove all your data from our servers, including all your stories,
                      photos, and recordings.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="h-12">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="h-12 bg-destructive hover:bg-destructive/90"
                    >
                      Delete Account
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
    </div>
  );
}
