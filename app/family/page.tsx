"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
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
  const { user } = useAuth();
  const { toast } = useToast();

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRelationship, setInviteRelationship] = useState("");
  const [invitePermission, setInvitePermission] = useState<'viewer' | 'contributor'>('viewer');
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const sendButtonRef = useRef<HTMLButtonElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
    }
  }, [user, router]);

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
    }) => {
      const response = await apiRequest("POST", "/api/family/invite", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/family/members"] });
      
      // Trigger confetti celebration!
      celebrateInvite();
      
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRelationship("");
      setInviteMessage("");
      
      // Show invite URL in development
      if (data.inviteUrl) {
        console.log('Invite URL:', data.inviteUrl);
      }
      
      toast({
        title: "Invitation sent! 🎉",
        description: "Your family member will receive an email invitation.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Invitation failed",
        description: error.message || "Could not send invitation.",
        variant: "destructive",
      });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/family/members"] });
      toast({
        title: "Member removed",
        description: "Family member has been removed from your circle.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Removal failed",
        description: error.message || "Could not remove family member.",
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

  const handleRemoveMember = async (memberId: string) => {
    await removeMutation.mutateAsync(memberId);
  };

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
    <div className="min-h-screen bg-background album-texture pb-20 md:pb-0">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
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
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Family Circle
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Share your stories with loved ones
              </p>
            </div>
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
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {member.name || member.email}
                              </p>
                              <Badge variant="secondary">
                                {member.relationship}
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
                        <Button variant="ghost" size="sm">
                          Resend
                        </Button>
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

            {/* Family Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  Family Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start h-11"
                  onClick={handleCopyInviteLink}
                >
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Copy Invite Link
                </Button>
                <Button variant="outline" className="w-full justify-start h-11">
                  <Share2 className="w-4 h-4 mr-2" />
                  Bulk Share Stories
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
