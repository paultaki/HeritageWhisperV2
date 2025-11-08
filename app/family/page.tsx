"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import Image from "next/image";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft,
  Users,
  UserPlus,
  Mail,
  Copy,
  Check,
  Clock,
  Heart,
  MessageSquare,
  Share2,
  Trash2,
  Eye,
  Activity,
  Link as LinkIcon,
} from "lucide-react";
import { DesktopPageHeader, MobilePageHeader } from "@/components/PageHeader";

interface FamilyMember {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  relationship: string | null;
  status: "pending" | "active" | "suspended";
  invited_at: string;
  first_accessed_at: string | null;
  last_accessed_at: string | null;
  access_count: number;
  created_at: string;
  inviteExpired?: boolean;
  permissionLevel?: 'viewer' | 'contributor';
}

interface FamilyActivityItem {
  id: string;
  familyMember: FamilyMember;
  storyTitle: string;
  activityType: "viewed" | "commented" | "favorited" | "shared";
  details?: string;
  createdAt: string;
}

export default function FamilyPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const updateFromDom = () => {
      const dark =
        document.documentElement.classList.contains("dark") ||
        document.body.classList.contains("dark");
      setIsDark(dark);
    };
    updateFromDom();
    const handler = () => updateFromDom();
    window.addEventListener("hw-theme-change", handler);
    return () => window.removeEventListener("hw-theme-change", handler);
  }, []);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRelationship, setInviteRelationship] = useState("");
  const [invitePermission, setInvitePermission] = useState<'viewer' | 'contributor'>('viewer');
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const sendButtonRef = useRef<HTMLButtonElement>(null);

  // Redirect to login if not authenticated (wait for auth to finish loading)
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isAuthLoading, router]);

  // Fetch family members
  const { data: familyMembersData, isLoading: loadingMembers, refetch: refetchMembers } = useQuery<{
    members: FamilyMember[];
    total: number;
  }>({
    queryKey: ["/api/family/members"],
    enabled: !!user,
    staleTime: 0, // Always consider stale so invalidation works immediately
  });

  const familyMembers = familyMembersData?.members || [];

  // Fetch family activity
  const { data: familyActivity = [], isLoading: loadingActivity } = useQuery<
    FamilyActivityItem[]
  >({
    queryKey: ["/api/family/activity"],
    enabled: !!user,
  });

  // Confetti celebration function
  const celebrateInvite = () => {
    // Get button position if available
    const button = sendButtonRef.current;
    let origin = { x: 0.5, y: 0.5 }; // Default to center

    if (button) {
      const rect = button.getBoundingClientRect();
      origin = {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
      };
    }

    // First burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: origin,
      colors: ['#7C6569', '#9C7280', '#BFA9AB', '#F9E5E8', '#FAF8F6'],
    });

    // Second burst (slight delay)
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: origin,
        colors: ['#7C6569', '#9C7280', '#BFA9AB', '#F9E5E8', '#FAF8F6'],
      });
    }, 150);

    // Third burst (opposite angle)
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: origin,
        colors: ['#7C6569', '#9C7280', '#BFA9AB', '#F9E5E8', '#FAF8F6'],
      });
    }, 300);
  };

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      name: string;
      relationship: string;
      permissionLevel?: 'viewer' | 'contributor';
    }) => {
      const response = await apiRequest("POST", "/api/family/invite", data);
      return response.json();
    },
    onSuccess: async (data) => {
      // Trigger confetti celebration!
      celebrateInvite();

      // Show success toast immediately
      toast({
        title: "Invitation sent! 🎉",
        description: "Your family member will receive an email invitation.",
      });

      // Invalidate and refetch to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ["/api/family/members"] });
      await refetchMembers();

      // Wait for confetti animation to finish (500ms) before closing dialog
      await new Promise(resolve => setTimeout(resolve, 500));

      // Close dialog
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRelationship("");
      setInviteMessage("");

      // Show invite URL in development
      if (data.inviteUrl) {
        console.log('Invite URL:', data.inviteUrl);
      }
    },
    onError: (error: any) => {
      // Better handling for duplicate invite
      if (error.message?.includes("already invited")) {
        toast({
          title: "Already invited",
          description: "This person already has an invitation. Try using 'Resend' instead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Invitation failed",
          description: error.message || "Could not send invitation.",
          variant: "destructive",
        });
      }
    },
  });

  // Remove family member mutation
  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await apiRequest(
        "DELETE",
        `/api/family/${memberId}`,
      );
      return response.json();
    },
    onMutate: async (memberId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/family/members"] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(["/api/family/members"]);

      // Optimistically update the UI
      queryClient.setQueryData(["/api/family/members"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          members: old.members.filter((m: FamilyMember) => m.id !== memberId),
          total: Math.max(0, (old.total || 0) - 1),
        };
      });

      // Return context with the snapshot
      return { previousData };
    },
    onSuccess: async () => {
      // Invalidate and refetch to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ["/api/family/members"] });
      await refetchMembers();
    },
    onError: (error: any, memberId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(["/api/family/members"], context.previousData);
      }
      toast({
        title: "Removal failed",
        description: error.message || "Could not remove family member.",
        variant: "destructive",
      });
    },
  });

  // Resend invitation mutation
  const resendMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const response = await apiRequest(
        "POST",
        `/api/family/${memberId}/resend`,
      );
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/family/members"] });
      await refetchMembers();
      toast({
        title: "Invitation resent! 📧",
        description: "A new invitation email has been sent.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Resend failed",
        description: error.message || "Could not resend invitation.",
        variant: "destructive",
      });
    },
  });

  // Update permission mutation
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ memberId, permissionLevel }: { memberId: string; permissionLevel: 'viewer' | 'contributor' }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/family/${memberId}/permissions`,
        { permissionLevel }
      );
      return response.json();
    },
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/family/members"] });
      await refetchMembers();
      const newLevel = variables.permissionLevel === 'contributor' ? 'Contributor' : 'Viewer';
      toast({
        title: "Permissions updated",
        description: `Changed to ${newLevel} - they can ${variables.permissionLevel === 'contributor' ? 'now submit questions' : 'only view stories'}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Could not update permissions.",
        variant: "destructive",
      });
    },
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail || !inviteRelationship) {
      toast({
        title: "Missing information",
        description: "Please provide email and relationship.",
        variant: "destructive",
      });
      return;
    }

    // Extract name from email if not provided separately
    const name = inviteEmail.split('@')[0];
    
    await inviteMutation.mutateAsync({
      email: inviteEmail,
      name: name,
      relationship: inviteRelationship,
      permissionLevel: invitePermission,
    });
  };

  const handleCopyInviteLink = () => {
    const inviteLink = `${window.location.origin}/family/join/${user?.id}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    toast({
      title: "Link copied",
      description: "Invite link copied to clipboard.",
    });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleRemoveMember = async (memberId: string, isPending: boolean = false) => {
    try {
      await removeMutation.mutateAsync(memberId);
      // Show success message after mutation completes
      if (isPending) {
        toast({
          title: "Invitation revoked",
          description: "The invitation has been cancelled.",
        });
      } else {
        toast({
          title: "Member removed",
          description: "Family member has been removed from your circle.",
        });
      }
    } catch (error) {
      // Error handled by mutation onError
    }
  };

  // Show loading spinner while checking authentication
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Group members by status
  const activeMembers = familyMembers.filter((m) => m.status === "active");
  const pendingMembers = familyMembers.filter((m) => m.status === "pending");

  // Calculate stats
  const totalMembers = activeMembers.length;
  const sharedStories = familyActivity.filter(
    (a) => a.activityType === "shared",
  ).length;
  const totalViews = familyActivity.filter(
    (a) => a.activityType === "viewed",
  ).length;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "viewed":
        return Eye;
      case "commented":
        return MessageSquare;
      case "favorited":
        return Heart;
      case "shared":
        return Share2;
      default:
        return Activity;
    }
  };

  const getActivityText = (activity: FamilyActivityItem) => {
    switch (activity.activityType) {
      case "viewed":
        return "viewed";
      case "commented":
        return "commented on";
      case "favorited":
        return "favorited";
      case "shared":
        return "shared";
      default:
        return "interacted with";
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const relationshipOptions = [
    "Son",
    "Daughter",
    "Grandson",
    "Granddaughter",
    "Great-Grandson",
    "Great-Granddaughter",
    "Niece",
    "Nephew",
    "Sibling",
    "Spouse",
    "Friend",
    "Other Family",
  ];

  return (
    <div className="min-h-screen flex overflow-x-hidden" style={{ backgroundColor: isDark ? "#1c1c1d" : "#FFF8F3" }}>
      {/* Header */}
      {/* Desktop Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <DesktopPageHeader
          icon={Users}
          title="Family Circle"
          subtitle="Share your stories with loved ones"
        />
        <MobilePageHeader
          icon={Users}
          title="Family Circle"
          subtitle="Share your stories"
        />
      </div>

      {/* Main content - with header spacing, centered */}
      <main className="w-full pb-20 md:pb-0 px-4 md:px-6 overflow-x-hidden" style={{ marginTop: 55 }}>
        <div className="max-w-6xl mx-auto py-4 md:py-6">
          {/* Page Header with Invite Button */}
          <div className="flex items-center justify-end mb-6">
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="w-full sm:w-auto min-h-[60px] px-6 md:px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium rounded-xl shadow-sm hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Invite Family
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold">
                  Invite Family Member
                </DialogTitle>
                <DialogDescription className="text-base text-gray-500">
                  Send an invitation to share your life stories
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-6 py-4">
                <div>
                  <Label htmlFor="email" className="text-base font-medium text-gray-900">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="mt-2 h-14 w-full px-4 py-3 text-base bg-white border border-gray-300 rounded-xl placeholder:text-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0"
                    placeholder="family@example.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="relationship" className="text-base font-medium text-gray-900">
                    Relationship
                  </Label>
                  <Select
                    value={inviteRelationship}
                    onValueChange={setInviteRelationship}
                  >
                    <SelectTrigger className="mt-2 h-14 w-full px-4 py-3 text-base bg-white border border-gray-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0">
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      {relationshipOptions.map((rel) => (
                        <SelectItem key={rel} value={rel} className="text-base">
                          {rel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="permission" className="text-base font-medium text-gray-900">
                    Permission Level
                  </Label>
                  <Select
                    value={invitePermission}
                    onValueChange={(value) => setInvitePermission(value as 'viewer' | 'contributor')}
                  >
                    <SelectTrigger className="mt-2 h-14 w-full px-4 py-3 text-base bg-white border border-gray-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer" className="text-base">
                        👁 Viewer - View stories only
                      </SelectItem>
                      <SelectItem value="contributor" className="text-base">
                        ✏️ Contributor - Can submit questions
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-2">
                    {invitePermission === 'viewer'
                      ? 'Read stories, listen to audio, view photos'
                      : 'Can also submit questions they want answered'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="message" className="text-base font-medium text-gray-900">
                    Personal Message (Optional)
                  </Label>
                  <Textarea
                    id="message"
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    className="mt-2 min-h-[96px] w-full px-4 py-3 text-base bg-white border border-gray-300 rounded-xl placeholder:text-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0"
                    placeholder="Add a personal message to your invitation..."
                    rows={3}
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-500">
                    Or share invite link:
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyInviteLink}
                    className="w-full min-h-[48px] px-6 py-3 bg-white text-gray-900 text-base font-medium border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200 justify-start"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-5 h-5 mr-2 text-green-700" />
                        Link Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5 mr-2" />
                        Copy Invite Link
                      </>
                    )}
                  </Button>
                </div>

                <DialogFooter className="gap-4 flex-col sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setInviteDialogOpen(false)}
                    className="w-full min-h-[48px] px-6 py-3 bg-white text-gray-900 text-base font-medium border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    ref={sendButtonRef}
                    type="submit"
                    disabled={inviteMutation.isPending}
                    className="w-full min-h-[60px] px-8 py-4 bg-blue-600 text-white text-lg font-medium rounded-xl shadow-sm hover:shadow-md hover:bg-blue-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200"
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    {inviteMutation.isPending
                      ? "Sending..."
                      : "Send Invitation"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Family Stats */}
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <Card className="bg-white border border-gray-200 rounded-xl">
                <div className="py-2.5 px-3 md:px-4">
                  <div className="text-center">
                    <Users className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 text-blue-600" />
                    <p className="text-xl md:text-3xl font-bold text-gray-900 leading-none mb-0.5">{totalMembers}</p>
                    <p className="text-xs md:text-base text-gray-500 leading-none mt-1">
                      Members
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-white border border-gray-200 rounded-xl">
                <div className="py-2.5 px-3 md:px-4">
                  <div className="text-center">
                    <Share2 className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 text-blue-600" />
                    <p className="text-xl md:text-3xl font-bold text-gray-900 leading-none mb-0.5">{sharedStories}</p>
                    <p className="text-xs md:text-base text-gray-500 leading-none mt-1">
                      Stories
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-white border border-gray-200 rounded-xl">
                <div className="py-2.5 px-3 md:px-4">
                  <div className="text-center">
                    <Eye className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 text-blue-600" />
                    <p className="text-xl md:text-3xl font-bold text-gray-900 leading-none mb-0.5">{totalViews}</p>
                    <p className="text-xs md:text-base text-gray-500 leading-none mt-1">Views</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Active Family Members */}
            <Card className="bg-white border border-gray-200 rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl font-semibold text-gray-900">
                  <Users className="w-5 h-5 text-blue-600" />
                  Family Members ({activeMembers.length})
                </CardTitle>
                <CardDescription className="text-sm md:text-base text-gray-500">
                  People who can view your stories
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeMembers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-4 text-gray-400" />
                    <p className="text-base md:text-lg text-gray-500 mb-6">
                      No family members yet
                    </p>
                    <Button
                      onClick={() => setInviteDialogOpen(true)}
                      className="min-h-[60px] px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium rounded-xl shadow-sm hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200"
                    >
                      <UserPlus className="w-5 h-5 mr-2" />
                      Invite Family Member
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex flex-col gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:shadow-sm transition-shadow overflow-hidden"
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <Avatar className="w-12 h-12 shrink-0">
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-medium">
                              {(member.name || member.email)[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-base md:text-lg text-gray-900 truncate">
                                {member.name || member.email}
                              </p>
                              {member.relationship && (
                                <Badge variant="secondary" className="text-sm bg-gray-100 text-gray-700 border-0">
                                  {member.relationship}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm md:text-base text-gray-500 break-all mt-1">{member.email}</p>
                            {member.last_accessed_at && (
                              <p className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                <Clock className="w-4 h-4" />
                                Last viewed {getRelativeTime(member.last_accessed_at)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Select
                            value={member.permissionLevel || 'viewer'}
                            onValueChange={(value: 'viewer' | 'contributor') =>
                              updatePermissionMutation.mutate({ memberId: member.id, permissionLevel: value })
                            }
                          >
                            <SelectTrigger className="flex-1 sm:flex-none min-h-[48px] sm:w-[160px] px-3 text-base border-gray-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer" className="text-base">
                                👁 Viewer
                              </SelectItem>
                              <SelectItem value="contributor" className="text-base">
                                ✏️ Contributor
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0 min-h-[48px] min-w-[48px] text-red-600 hover:text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 rounded-xl"
                              >
                                <Trash2 className="w-5 h-5" />
                              </Button>
                            </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-2xl font-semibold text-gray-900">
                                Remove family member?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-base text-gray-500">
                                {member.name || member.email} will no longer be
                                able to view your stories. This action can be
                                undone by inviting them again.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-3 flex-col sm:flex-row">
                              <AlertDialogCancel className="w-full min-h-[48px] px-6 py-3 bg-white text-gray-900 text-base font-medium border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveMember(member.id)}
                                className="w-full min-h-[48px] px-6 py-3 bg-red-600 text-white text-base font-medium rounded-xl hover:bg-red-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-all duration-200"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Invitations */}
            {pendingMembers.length > 0 && (
              <Card className="bg-white border border-gray-200 rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl font-semibold text-gray-900">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Pending Invitations ({pendingMembers.length})
                  </CardTitle>
                  <CardDescription className="text-sm md:text-base text-gray-500">Waiting for acceptance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex flex-col gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden"
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <Avatar className="w-12 h-12 shrink-0">
                            <AvatarFallback className="bg-gray-200 text-gray-600 text-lg font-medium">
                              {member.email[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-base md:text-lg text-gray-900 break-all">{member.email}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                              {member.relationship && (
                                <Badge variant="outline" className="text-sm border-gray-300 text-gray-700">
                                  {member.relationship}
                                </Badge>
                              )}
                              {member.inviteExpired && (
                                <Badge className="text-sm bg-red-600 text-white border-0">Expired</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              Invited {getRelativeTime(member.invited_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Button
                            variant="ghost"
                            onClick={() => resendMutation.mutate(member.id)}
                            disabled={resendMutation.isPending}
                            className="flex-1 sm:flex-none min-h-[48px] px-4 text-base text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 rounded-xl"
                          >
                            {resendMutation.isPending ? "Sending..." : "Resend"}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                className="flex-1 sm:flex-none min-h-[48px] px-4 text-base text-red-600 hover:text-red-700 hover:bg-red-50 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 rounded-xl"
                              >
                                Revoke
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-2xl font-semibold text-gray-900">
                                  Revoke invitation?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-base text-gray-500">
                                  This will cancel the invitation to{" "}
                                  {member.email}. They won't be able to use the
                                  invite link.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="gap-3 flex-col sm:flex-row">
                                <AlertDialogCancel className="w-full min-h-[48px] px-6 py-3 bg-white text-gray-900 text-base font-medium border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveMember(member.id, true)}
                                  className="w-full min-h-[48px] px-6 py-3 bg-red-600 text-white text-base font-medium rounded-xl hover:bg-red-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-all duration-200"
                                >
                                  Revoke
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Recent Activity */}
          <div className="space-y-6">
            <Card className="bg-white border border-gray-200 rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl font-semibold text-gray-900">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-sm md:text-base text-gray-500">
                  What your family has been viewing
                </CardDescription>
              </CardHeader>
              <CardContent>
                {familyActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-base text-gray-500">
                      No activity yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {familyActivity.slice(0, 10).map((activity) => {
                      const ActivityIcon = getActivityIcon(
                        activity.activityType,
                      );
                      return (
                        <div key={activity.id} className="flex gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-blue-100">
                              <ActivityIcon className="w-4 h-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm md:text-base text-gray-900 leading-snug">
                              <span className="font-semibold">
                                {activity.familyMember.name ||
                                  activity.familyMember.email}
                              </span>{" "}
                              <span className="text-gray-500">
                                {getActivityText(activity)}
                              </span>{" "}
                              <span className="font-medium">
                                "{activity.storyTitle}"
                              </span>
                            </p>
                            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
                              {getRelativeTime(activity.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
      </main>
    </div>
  );
}
