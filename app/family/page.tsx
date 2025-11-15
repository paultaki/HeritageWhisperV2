"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
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
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Users,
  UserPlus,
  Mail,
  Copy,
  Check,
  Eye,
  Activity,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from "lucide-react";
import { DesktopPageHeader, MobilePageHeader } from "@/components/PageHeader";
import { UpgradeModal } from "@/components/upgrade/UpgradeModal";
import { useSubscription } from "@/hooks/use-subscription";
import { FamilySummaryTile } from "@/components/family/FamilySummaryTile";
import { FamilyMemberCard } from "@/components/family/FamilyMemberCard";
import { PendingInviteCard } from "@/components/family/PendingInviteCard";
import { PrivacyInfoCard } from "@/components/family/PrivacyInfoCard";
import {
  useRecentActivity,
  formatActivityEvent,
  getActivitySummary,
  getRelativeTime,
} from "@/hooks/useRecentActivity";

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
  permissionLevel?: "viewer" | "contributor";
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

  // Subscription state
  const { isPaid, canInviteFamily } = useSubscription();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Invite form state
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRelationship, setInviteRelationship] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const sendButtonRef = useRef<HTMLButtonElement>(null);

  // Pending invites collapse state
  const [pendingExpanded, setPendingExpanded] = useState(true);

  // Redirect to login if not authenticated (wait for auth to finish loading)
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isAuthLoading, router]);

  // Fetch family members
  const {
    data: familyMembersData,
    isLoading: loadingMembers,
    refetch: refetchMembers,
  } = useQuery<{
    members: FamilyMember[];
    total: number;
  }>({
    queryKey: ["/api/family/members"],
    enabled: !!user,
    staleTime: 0, // Always consider stale so invalidation works immediately
  });

  const familyMembers = familyMembersData?.members || [];

  // Fetch recent activity
  const { data: activityEvents = [], isLoading: loadingActivity } = useRecentActivity({
    limit: 8,
    days: 30,
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
      colors: ["#7C6569", "#9C7280", "#BFA9AB", "#F9E5E8", "#FAF8F6"],
    });

    // Second burst (slight delay)
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: origin,
        colors: ["#7C6569", "#9C7280", "#BFA9AB", "#F9E5E8", "#FAF8F6"],
      });
    }, 150);

    // Third burst (opposite angle)
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: origin,
        colors: ["#7C6569", "#9C7280", "#BFA9AB", "#F9E5E8", "#FAF8F6"],
      });
    }, 300);
  };

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      name?: string;
      relationship?: string;
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
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Close dialog
      setInviteDialogOpen(false);
      setInviteName("");
      setInviteEmail("");
      setInviteRelationship("");
      setInviteMessage("");

      // Show invite URL in development
      if (data.inviteUrl) {
        console.log("Invite URL:", data.inviteUrl);
      }
    },
    onError: (error: any) => {
      // Better handling for duplicate invite
      if (error.message?.includes("already invited")) {
        toast({
          title: "Already invited",
          description:
            "This person already has an invitation. Try using 'Resend' instead.",
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
      const response = await apiRequest("DELETE", `/api/family/${memberId}`);
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
        `/api/family/${memberId}/resend`
      );
      return response.json();
    },
    onSuccess: async (data, memberId) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/family/members"] });
      await refetchMembers();

      // Check if it was a pending or active member
      const member = familyMembers.find((m) => m.id === memberId);
      const isActive = member?.status === "active";

      toast({
        title: isActive ? "Sign-in link sent! 📧" : "Invitation resent! 📧",
        description: isActive
          ? "A new magic link has been sent to their email."
          : "A new invitation email has been sent.",
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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail) {
      toast({
        title: "Missing information",
        description: "Please provide an email address.",
        variant: "destructive",
      });
      return;
    }

    await inviteMutation.mutateAsync({
      email: inviteEmail,
      ...(inviteName && { name: inviteName }),
      ...(inviteRelationship && { relationship: inviteRelationship }),
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

  const handleRemoveMember = async (
    memberId: string,
    isPending: boolean = false
  ) => {
    try {
      await removeMutation.mutateAsync(memberId);
      // Show success message after mutation completes
      if (isPending) {
        toast({
          title: "Invitation cancelled",
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
      <div className="hw-page flex items-center justify-center">
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

  // Calculate activity summary for the Recent Activity card
  const activitySummary = getActivitySummary(activityEvents);

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
    <div
      className="hw-page flex overflow-x-hidden"
      style={{ backgroundColor: isDark ? "#1c1c1d" : "#FFF8F3" }}
    >
      {/* Header */}
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
      <main
        className="w-full pb-20 md:pb-0 px-4 md:px-6 overflow-x-hidden"
        style={{ marginTop: 55 }}
      >
        <div className="max-w-7xl mx-auto py-5 md:py-6">
          {/* Emotional Header */}
          <div className="text-center md:text-left mb-6 md:mb-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-3">
              Family Circle
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 max-w-lg mx-auto md:mx-0 leading-relaxed">
              A private place to share your stories with the people who matter.
            </p>
          </div>

          {/* Main Content - Single Column, Left-Aligned */}
          <div className="space-y-5 md:space-y-6">
            {/* Row 1: Compact Summary Chips (Desktop & Mobile) */}
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <FamilySummaryTile
                icon={Users}
                label="Family Members"
                value={totalMembers}
              />
              <FamilySummaryTile
                icon={UserPlus}
                label="Invite Family"
                value="+"
                variant="primary"
                onClick={() => {
                  if (canInviteFamily) {
                    setInviteDialogOpen(true);
                  } else {
                    setUpgradeModalOpen(true);
                  }
                }}
              />
            </div>

            {/* Row 2: Privacy + Activity Cards (Desktop side-by-side, Mobile stacked) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
              {/* Privacy Card */}
              <PrivacyInfoCard />

              {/* Recent Activity Card */}
              <Card className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2.5 text-xl md:text-2xl font-semibold text-gray-900 leading-tight">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                      <Activity className="w-6 h-6 text-blue-600" />
                    </div>
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingActivity ? (
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex gap-2.5 animate-pulse">
                          <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="h-5 bg-gray-200 rounded w-3/4" />
                            <div className="h-4 bg-gray-200 rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : activityEvents.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <Activity className="w-8 h-8 text-gray-400" />
                      </div>
                      <h4 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 leading-tight">
                        No activity yet
                      </h4>
                      <p className="text-base md:text-lg text-gray-600 leading-snug max-w-xs mx-auto">
                        When your family listens to a story or joins your circle,
                        you'll see it here.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Summary line */}
                      {activitySummary.storiesListened > 0 && (
                        <div className="mb-4 pb-3 border-b border-gray-200">
                          <p className="text-base md:text-lg text-gray-700 font-medium">
                            This month:{" "}
                            {activitySummary.uniqueListeners > 0 && (
                              <>
                                {activitySummary.uniqueListeners} family{" "}
                                {activitySummary.uniqueListeners === 1 ? "member" : "members"}{" "}
                                listened to{" "}
                              </>
                            )}
                            {activitySummary.storiesListened}{" "}
                            {activitySummary.storiesListened === 1 ? "story" : "stories"}
                            {activitySummary.storiesRecorded > 0 && (
                              <>
                                {" "}• {activitySummary.storiesRecorded} new{" "}
                                {activitySummary.storiesRecorded === 1 ? "story" : "stories"} recorded
                              </>
                            )}
                          </p>
                        </div>
                      )}

                      {/* Activity list */}
                      <div className="space-y-3">
                        {activityEvents.slice(0, 8).map((event) => (
                          <div key={event.id} className="flex flex-col gap-1">
                            <p className="text-base md:text-lg font-medium text-gray-900 leading-snug">
                              {formatActivityEvent(event)}
                            </p>
                            {event.storyTitle && event.eventType === "story_listened" && (
                              <p className="text-sm md:text-base text-gray-600">
                                "{event.storyTitle}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

              {/* Active Family Members Section */}
              <section>
                <div className="mb-4">
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 leading-tight">
                    Family Members {activeMembers.length > 0 && `(${activeMembers.length})`}
                  </h2>
                  <p className="text-base md:text-lg text-gray-600 leading-snug">
                    People who can view your stories
                  </p>
                </div>

                {activeMembers.length === 0 ? (
                  <Card className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="text-center py-12 md:py-14 px-6">
                      <div className="w-18 h-18 md:w-20 md:h-20 mx-auto mb-5 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="w-9 h-9 md:w-10 md:h-10 text-blue-600" />
                      </div>
                      <h3 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">
                        No family members yet
                      </h3>
                      <p className="text-base md:text-lg text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
                        Invite your loved ones to start sharing your life stories
                      </p>
                      <Button
                        onClick={() => {
                          if (canInviteFamily) {
                            setInviteDialogOpen(true);
                          } else {
                            setUpgradeModalOpen(true);
                          }
                        }}
                        className="min-h-[56px] px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-base md:text-lg font-medium rounded-xl shadow-sm hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200"
                      >
                        <UserPlus className="w-5 h-5 mr-2" />
                        Invite Family Member
                        {!canInviteFamily && (
                          <span className="ml-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold">
                            Premium
                          </span>
                        )}
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {activeMembers.map((member) => (
                      <FamilyMemberCard
                        key={member.id}
                        member={member}
                        onSendLoginLink={() => resendMutation.mutate(member.id)}
                        onRemove={() => handleRemoveMember(member.id, false)}
                        isSendingLink={resendMutation.isPending}
                        getRelativeTime={getRelativeTime}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Pending Invitations Section */}
              {pendingMembers.length > 0 && (
                <section>
                  <button
                    onClick={() => setPendingExpanded(!pendingExpanded)}
                    className="w-full mb-3 flex items-center justify-between group"
                  >
                    <div>
                      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 text-left leading-tight">
                        Pending Invitations ({pendingMembers.length})
                      </h2>
                      <p className="text-base md:text-lg text-gray-600 text-left leading-snug">
                        Waiting for acceptance
                      </p>
                    </div>
                    <div className="shrink-0 ml-3">
                      {pendingExpanded ? (
                        <ChevronUp className="w-7 h-7 text-gray-500 group-hover:text-gray-700 transition-colors" />
                      ) : (
                        <ChevronDown className="w-7 h-7 text-gray-500 group-hover:text-gray-700 transition-colors" />
                      )}
                    </div>
                  </button>

                  {pendingExpanded && (
                    <>
                      <div className="space-y-3 mb-3">
                        {pendingMembers.map((member) => (
                          <PendingInviteCard
                            key={member.id}
                            member={member}
                            onResend={() => resendMutation.mutate(member.id)}
                            onRevoke={() => handleRemoveMember(member.id, true)}
                            isResending={resendMutation.isPending}
                            getRelativeTime={getRelativeTime}
                          />
                        ))}
                      </div>
                      <p className="text-xs md:text-sm text-gray-600 pl-3.5 border-l-4 border-blue-200 py-1.5 leading-snug">
                        They'll appear as a member as soon as they accept the invitation.
                      </p>
                    </>
                  )}
                </section>
              )}
          </div>

          {/* Footer Help CTA */}
          <div className="mt-8 md:mt-10 text-center py-6 md:py-7 border-t border-gray-200">
            <p className="text-sm md:text-base text-gray-700 mb-3.5 flex items-center justify-center gap-2">
              <HelpCircle className="w-4.5 h-4.5 text-gray-500" />
              Need help inviting family?
            </p>
            <Button
              variant="outline"
              onClick={() => {
                // TODO: Link to help/guide page when available
                toast({
                  title: "Coming soon",
                  description: "Step-by-step guide will be available soon.",
                });
              }}
              className="min-h-[48px] px-6 py-2.5 text-sm md:text-base font-medium rounded-xl border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200"
            >
              View Step-by-Step Guide
            </Button>
          </div>
        </div>
      </main>

      {/* Invite Dialog - only for premium users */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle className="text-2xl md:text-3xl font-semibold">
              Invite Family Member
            </DialogTitle>
            <DialogDescription className="text-base md:text-lg text-gray-600">
              Send an invitation to share your life stories
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-5 py-3">
            <div>
              <Label
                htmlFor="name"
                className="text-base font-medium text-gray-900"
              >
                Name{" "}
                <span className="text-gray-500 font-normal">(Optional)</span>
              </Label>
              <Input
                id="name"
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="mt-2 h-12 w-full px-4 py-2.5 text-base bg-white border border-gray-300 rounded-xl placeholder:text-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0"
                placeholder="John Smith"
              />
            </div>

            <div>
              <Label
                htmlFor="email"
                className="text-base font-medium text-gray-900"
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="mt-2 h-12 w-full px-4 py-2.5 text-base bg-white border border-gray-300 rounded-xl placeholder:text-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0"
                placeholder="family@example.com"
                required
              />
            </div>

            <div>
              <Label
                htmlFor="relationship"
                className="text-base font-medium text-gray-900"
              >
                Relationship{" "}
                <span className="text-gray-500 font-normal">(Optional)</span>
              </Label>
              <Select
                value={inviteRelationship}
                onValueChange={setInviteRelationship}
              >
                <SelectTrigger className="mt-2 h-12 w-full px-4 py-2.5 text-base bg-white border border-gray-300 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0">
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
              <Label
                htmlFor="message"
                className="text-base font-medium text-gray-900"
              >
                Personal Message{" "}
                <span className="text-gray-500 font-normal">(Optional)</span>
              </Label>
              <Textarea
                id="message"
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                className="mt-2 min-h-[88px] w-full px-4 py-2.5 text-base bg-white border border-gray-300 rounded-xl placeholder:text-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0"
                placeholder="Add a personal message to your invitation..."
                rows={3}
              />
            </div>

            <Separator />

            <div className="space-y-2.5">
              <Label className="text-xs md:text-sm font-medium text-gray-600">
                Or share invite link:
              </Label>
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyInviteLink}
                className="w-full min-h-[48px] px-5 py-2.5 bg-white text-gray-900 text-sm md:text-base font-medium border border-gray-300 rounded-xl hover:bg-gray-50 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200 justify-start"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4.5 h-4.5 mr-2 text-green-700" />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4.5 h-4.5 mr-2" />
                    Copy Invite Link
                  </>
                )}
              </Button>
            </div>

            <DialogFooter className="gap-3 flex-col sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteDialogOpen(false)}
                className="w-full min-h-[48px] px-5 py-2.5 bg-white text-gray-900 text-sm md:text-base font-medium border border-gray-300 rounded-xl hover:bg-gray-50 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                ref={sendButtonRef}
                type="submit"
                disabled={inviteMutation.isPending}
                className="w-full min-h-[56px] px-7 py-3.5 bg-blue-600 text-white text-base md:text-lg font-medium rounded-xl shadow-sm hover:shadow-md hover:bg-blue-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200"
              >
                <Mail className="w-5 h-5 mr-2" />
                {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upgrade Modal for free users */}
      <UpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        trigger="family_invite"
      />
    </div>
  );
}
