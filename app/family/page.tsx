"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import Image from "next/image";
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
  const { data: familyMembersData, isLoading: loadingMembers } = useQuery<{
    members: FamilyMember[];
    total: number;
  }>({
    queryKey: ["/api/family/members"],
    enabled: !!user,
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
      colors: ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'],
    });

    // Second burst (slight delay)
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: origin,
        colors: ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'],
      });
    }, 150);

    // Third burst (opposite angle)
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: origin,
        colors: ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'],
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

      // Wait for confetti animation to finish (500ms) before closing dialog
      await new Promise(resolve => setTimeout(resolve, 500));

      // Close dialog and refetch data
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRelationship("");
      setInviteMessage("");

      await queryClient.refetchQueries({ queryKey: ["/api/family/members"] });

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
      // Invalidate to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ["/api/family/members"] });
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
      await queryClient.refetchQueries({ queryKey: ["/api/family/members"] });
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
      await queryClient.refetchQueries({ queryKey: ["/api/family/members"] });
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
    <div className="min-h-screen flex" style={{ backgroundColor: isDark ? "#1c1c1d" : "#FFF8F3" }}>
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur"
        style={{
          backgroundColor: isDark ? '#252728' : 'rgba(255,255,255,0.95)',
          borderBottom: `1px solid ${isDark ? '#3b3d3f' : '#e5e7eb'}`,
          color: isDark ? '#b0b3b8' : undefined,
          height: 55,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          width: '100%'
        }}
      >
        <div className="flex items-center gap-3 w-full">
          <Image
            src="/Logo Icon hw.svg"
            alt="Heritage Whisper"
            width={72}
            height={72}
            className="h-[72px] w-auto"
          />
          <Users className="w-6 h-6" style={{ color: isDark ? '#b0b3b8' : '#1f2937' }} />
          <h1 className="text-2xl font-bold" style={{ color: isDark ? '#b0b3b8' : '#111827' }}>Family Circle</h1>
        </div>
      </header>

      {/* Left Sidebar - Desktop Only */}
      {isDesktop && (
        <aside
          className="hidden lg:flex lg:w-56 flex-col gap-1.5 p-2"
          style={{
            position: "fixed",
            top: 72,
            left: 0,
            height: "calc(100vh - 72px)",
            backgroundColor: "transparent",
            borderRight: "none",
            color: isDark ? "#b0b3b8" : undefined,
          }}
        >
          <LeftSidebar />
        </aside>
      )}

      {/* Main content - with header and sidebar spacing */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0 lg:ml-56" style={{ marginTop: 55 }}>
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          {/* Page Header with Invite Button */}
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div>
              <p className="text-sm md:text-base text-muted-foreground">
                Share your stories with loved ones
              </p>
            </div>

            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 px-4 md:px-6">
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Family
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  Invite Family Member
                </DialogTitle>
                <DialogDescription>
                  Send an invitation to share your life stories
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4 py-4">
                <div>
                  <Label htmlFor="email" className="text-base">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="mt-2 h-12 text-base"
                    placeholder="family@example.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="relationship" className="text-base">
                    Relationship
                  </Label>
                  <Select
                    value={inviteRelationship}
                    onValueChange={setInviteRelationship}
                  >
                    <SelectTrigger className="mt-2 h-12 text-base">
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      {relationshipOptions.map((rel) => (
                        <SelectItem key={rel} value={rel}>
                          {rel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="permission" className="text-base">
                    Permission Level
                  </Label>
                  <Select
                    value={invitePermission}
                    onValueChange={(value) => setInvitePermission(value as 'viewer' | 'contributor')}
                  >
                    <SelectTrigger className="mt-2 h-12 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">
                        👁 Viewer - View stories only
                      </SelectItem>
                      <SelectItem value="contributor">
                        ✏️ Contributor - Can submit questions
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {invitePermission === 'viewer' 
                      ? 'Read stories, listen to audio, view photos'
                      : 'Can also submit questions they want answered'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="message" className="text-base">
                    Personal Message (Optional)
                  </Label>
                  <Textarea
                    id="message"
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    className="mt-2 text-base"
                    placeholder="Add a personal message to your invitation..."
                    rows={3}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Or share invite link:
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyInviteLink}
                    className="w-full h-12 justify-start"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4 mr-2 text-green-600" />
                        Link Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Invite Link
                      </>
                    )}
                  </Button>
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setInviteDialogOpen(false)}
                    className="h-12"
                  >
                    Cancel
                  </Button>
                  <Button
                    ref={sendButtonRef}
                    type="submit"
                    disabled={inviteMutation.isPending}
                    className="h-12"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {inviteMutation.isPending
                      ? "Sending..."
                      : "Send Invitation"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Family Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="text-3xl font-bold">{totalMembers}</p>
                    <p className="text-sm text-muted-foreground">
                      Family Members
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Share2 className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="text-3xl font-bold">{sharedStories}</p>
                    <p className="text-sm text-muted-foreground">
                      Shared Stories
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Eye className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="text-3xl font-bold">{totalViews}</p>
                    <p className="text-sm text-muted-foreground">Total Views</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Active Family Members */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Family Members ({activeMembers.length})
                </CardTitle>
                <CardDescription>
                  People who can view your stories
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground mb-4">
                      No family members yet
                    </p>
                    <Button onClick={() => setInviteDialogOpen(true)}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite Your First Family Member
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {(member.name || member.email)[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">
                                {member.name || member.email}
                              </p>
                              {member.relationship && (
                                <Badge variant="secondary">
                                  {member.relationship}
                                </Badge>
                              )}
                              <Badge variant={member.permissionLevel === 'contributor' ? 'default' : 'outline'} className="text-xs">
                                {member.permissionLevel === 'contributor' ? '✏️ Contributor' : '👁 Viewer'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span>{member.email}</span>
                              {member.last_accessed_at && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Last viewed{" "}
                                  {getRelativeTime(member.last_accessed_at)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={member.permissionLevel || 'viewer'}
                            onValueChange={(value: 'viewer' | 'contributor') => 
                              updatePermissionMutation.mutate({ memberId: member.id, permissionLevel: value })
                            }
                          >
                            <SelectTrigger className="h-9 w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer">
                                👁 Viewer
                              </SelectItem>
                              <SelectItem value="contributor">
                                ✏️ Contributor
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Remove family member?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {member.name || member.email} will no longer be
                                able to view your stories. This action can be
                                undone by inviting them again.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="h-12">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveMember(member.id)}
                                className="h-12 bg-destructive hover:bg-destructive/90"
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Pending Invitations ({pendingMembers.length})
                  </CardTitle>
                  <CardDescription>Waiting for acceptance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-muted">
                              {member.email[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{member.email}</p>
                              {member.relationship && (
                                <Badge variant="outline">
                                  {member.relationship}
                                </Badge>
                              )}
                              {member.inviteExpired && (
                                <Badge variant="destructive">Expired</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Invited {getRelativeTime(member.invited_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resendMutation.mutate(member.id)}
                            disabled={resendMutation.isPending}
                          >
                            {resendMutation.isPending ? "Sending..." : "Resend"}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                              >
                                Revoke
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Revoke invitation?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will cancel the invitation to{" "}
                                  {member.email}. They won't be able to use the
                                  invite link.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="h-12">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveMember(member.id, true)}
                                  className="h-12 bg-destructive hover:bg-destructive/90"
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  What your family has been viewing
                </CardDescription>
              </CardHeader>
              <CardContent>
                {familyActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
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
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <ActivityIcon className="w-4 h-4 text-primary" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <span className="font-medium">
                                {activity.familyMember.name ||
                                  activity.familyMember.email}
                              </span>{" "}
                              <span className="text-muted-foreground">
                                {getActivityText(activity)}
                              </span>{" "}
                              <span className="font-medium">
                                "{activity.storyTitle}"
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
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
