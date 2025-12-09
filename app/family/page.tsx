"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Card } from "@/components/ui/card";
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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { DesktopPageHeader, MobilePageHeader } from "@/components/PageHeader";
import { UpgradeModal } from "@/components/upgrade/UpgradeModal";
import { useSubscription } from "@/hooks/use-subscription";
import { FamilyMemberCard } from "@/components/family/FamilyMemberCard";
import { PendingInviteCard } from "@/components/family/PendingInviteCard";
import { PrivacyInfoCard } from "@/components/family/PrivacyInfoCard";
import { FamilyUpgradeCallout } from "@/components/family/FamilyUpgradeCallout";
import { getRelativeTime } from "@/hooks/useRecentActivity";

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
  inviteExpiresAt?: string | null;
  sessionExpiresAt?: string | null;
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
    staleTime: 0,
  });

  const familyMembers = familyMembersData?.members || [];

  // Confetti celebration function
  const celebrateInvite = () => {
    const button = sendButtonRef.current;
    let origin = { x: 0.5, y: 0.5 };

    if (button) {
      const rect = button.getBoundingClientRect();
      origin = {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
      };
    }

    confetti({
      particleCount: 100,
      spread: 70,
      origin: origin,
      colors: ["#203954", "#3E6A5A", "#CBA46A", "#F4E6CC", "#F7F2EC"],
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: origin,
        colors: ["#203954", "#3E6A5A", "#CBA46A", "#F4E6CC", "#F7F2EC"],
      });
    }, 150);

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: origin,
        colors: ["#203954", "#3E6A5A", "#CBA46A", "#F4E6CC", "#F7F2EC"],
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
      celebrateInvite();

      toast({
        title: "Invitation sent!",
        description: "Your family member will receive an email invitation.",
      });

      await queryClient.invalidateQueries({ queryKey: ["/api/family/members"] });
      await refetchMembers();

      await new Promise((resolve) => setTimeout(resolve, 500));

      setInviteDialogOpen(false);
      setInviteName("");
      setInviteEmail("");
      setInviteRelationship("");
      setInviteMessage("");

      if (data.inviteUrl) {
        console.log("Invite URL:", data.inviteUrl);
      }
    },
    onError: (error: any) => {
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
      await queryClient.cancelQueries({ queryKey: ["/api/family/members"] });

      const previousData = queryClient.getQueryData(["/api/family/members"]);

      queryClient.setQueryData(["/api/family/members"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          members: old.members.filter((m: FamilyMember) => m.id !== memberId),
          total: Math.max(0, (old.total || 0) - 1),
        };
      });

      return { previousData };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/family/members"] });
      await refetchMembers();
    },
    onError: (error: any, memberId, context) => {
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

      const member = familyMembers.find((m) => m.id === memberId);
      const isActive = member?.status === "active";

      toast({
        title: isActive ? "Sign-in link sent!" : "Invitation resent!",
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

    if (!inviteEmail || !inviteName) {
      toast({
        title: "Missing information",
        description: "Please provide both name and email address.",
        variant: "destructive",
      });
      return;
    }

    const dbRelationship = inviteRelationship ? getRelationshipDbValue(inviteRelationship) : null;

    await inviteMutation.mutateAsync({
      email: inviteEmail,
      name: inviteName,
      ...(dbRelationship && { relationship: dbRelationship }),
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#203954]"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Group members by status
  const activeMembers = familyMembers.filter((m) => m.status === "active");
  const pendingMembers = familyMembers.filter((m) => m.status === "pending");

  const totalMembers = activeMembers.length;

  // Relationship options - label is shown to user, dbValue is sent to API
  const relationshipOptions = [
    { label: "Son", dbValue: "child" },
    { label: "Daughter", dbValue: "child" },
    { label: "Grandson", dbValue: "grandchild" },
    { label: "Granddaughter", dbValue: "grandchild" },
    { label: "Niece", dbValue: "other" },
    { label: "Nephew", dbValue: "other" },
    { label: "Sibling", dbValue: "sibling" },
    { label: "Spouse", dbValue: "spouse" },
    { label: "Partner", dbValue: "partner" },
    { label: "Parent", dbValue: "parent" },
    { label: "Grandparent", dbValue: "grandparent" },
    { label: "Friend", dbValue: "other" },
    { label: "Other Family", dbValue: "other" },
  ];

  // Helper to get database value from selected label
  const getRelationshipDbValue = (label: string) => {
    const option = relationshipOptions.find((opt) => opt.label === label);
    return option?.dbValue || null;
  };

  return (
    <div
      className="hw-page flex overflow-x-hidden"
      style={{ backgroundColor: isDark ? "#1c1c1d" : "#F7F2EC" }}
    >
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <DesktopPageHeader
          title="Family Circle"
          subtitle="Share your stories with loved ones"
        />
        <MobilePageHeader
          title="Family Circle"
          subtitle="Share your stories"
        />
      </div>

      {/* Main content */}
      <main
        className="w-full pb-20 md:pb-0 px-4 md:px-6 overflow-x-hidden"
        style={{ marginTop: 55 }}
      >
        <div className="max-w-2xl mx-auto py-6 md:py-8">
          {/* Upgrade Callout for Free Users */}
          {!isPaid && <FamilyUpgradeCallout className="mb-6 md:mb-8" />}

          {/* Hero Section - Vertical Stack */}
          <section className="mb-8 md:mb-10">
            {/* Title with serif font */}
            <h1
              className="text-3xl md:text-4xl font-bold text-[#203954] mb-2 leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Family Circle
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-[#4A4A4A] mb-6 leading-relaxed">
              Invite family to listen to your stories.
            </p>

            {/* Primary Action Button */}
            <Button
              onClick={() => {
                if (canInviteFamily) {
                  setInviteDialogOpen(true);
                } else {
                  setUpgradeModalOpen(true);
                }
              }}
              className="w-full md:w-auto min-h-[60px] px-8 py-4 bg-[#203954] hover:bg-[#1B3047] text-white text-lg font-medium rounded-xl shadow-sm hover:shadow-md active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#203954] focus:ring-offset-[#F7F2EC] transition-all duration-200"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Invite Family Member
              {!canInviteFamily && (
                <span className="ml-2 rounded-full bg-[#CBA46A] px-2.5 py-0.5 text-xs font-semibold text-[#1F1F1F]">
                  Premium
                </span>
              )}
            </Button>
          </section>

          {/* Privacy Strip */}
          <div className="mb-8 md:mb-10">
            <PrivacyInfoCard />
          </div>

          {/* Members Section */}
          <section className="mb-8 md:mb-10">
            <h2
              className="text-2xl md:text-3xl font-bold text-[#203954] mb-4 leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Members {totalMembers > 0 && `(${totalMembers})`}
            </h2>

            {activeMembers.length === 0 ? (
              <Card className="bg-white border border-[#D2C9BD] rounded-xl overflow-hidden">
                <div className="text-center py-12 md:py-14 px-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-5 rounded-full bg-[#F4E6CC] flex items-center justify-center">
                    <Users className="w-8 h-8 md:w-10 md:h-10 text-[#203954]" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold text-[#1F1F1F] mb-3">
                    No family members yet
                  </h3>
                  <p className="text-base md:text-lg text-[#4A4A4A] mb-6 max-w-md mx-auto leading-relaxed">
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
                    className="min-h-[56px] px-7 py-3.5 bg-[#203954] hover:bg-[#1B3047] text-white text-base md:text-lg font-medium rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#203954] transition-all duration-300"
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Invite Family Member
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
                className="w-full mb-4 flex items-center justify-between group"
              >
                <h2
                  className="text-2xl md:text-3xl font-bold text-[#203954] text-left leading-tight"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Pending ({pendingMembers.length})
                </h2>
                <div className="shrink-0 ml-3 w-10 h-10 flex items-center justify-center rounded-lg text-[#8A8378] group-hover:text-[#203954] group-hover:bg-[#EFE6DA] transition-colors">
                  {pendingExpanded ? (
                    <ChevronUp className="w-6 h-6" />
                  ) : (
                    <ChevronDown className="w-6 h-6" />
                  )}
                </div>
              </button>

              {pendingExpanded && (
                <div className="space-y-3">
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
              )}
            </section>
          )}
        </div>
      </main>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle
              className="text-2xl md:text-3xl font-semibold text-[#203954]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Invite Family Member
            </DialogTitle>
            <DialogDescription className="text-base md:text-lg text-[#4A4A4A]">
              Send an invitation to share your life stories
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-5 py-3">
            <div>
              <Label
                htmlFor="name"
                className="text-base font-medium text-[#1F1F1F]"
              >
                Name
              </Label>
              <Input
                id="name"
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="mt-2 h-14 w-full px-4 py-3 text-base bg-white border border-[#D2C9BD] rounded-xl placeholder:text-[#8A8378] focus:border-[#203954] focus:ring-2 focus:ring-[#203954] focus:ring-offset-0"
                placeholder="John Smith"
                required
              />
            </div>

            <div>
              <Label
                htmlFor="email"
                className="text-base font-medium text-[#1F1F1F]"
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="mt-2 h-14 w-full px-4 py-3 text-base bg-white border border-[#D2C9BD] rounded-xl placeholder:text-[#8A8378] focus:border-[#203954] focus:ring-2 focus:ring-[#203954] focus:ring-offset-0"
                placeholder="family@example.com"
                required
              />
            </div>

            <div>
              <Label
                htmlFor="relationship"
                className="text-base font-medium text-[#1F1F1F]"
              >
                Relationship{" "}
                <span className="text-[#8A8378] font-normal">(Optional)</span>
              </Label>
              <Select
                value={inviteRelationship}
                onValueChange={setInviteRelationship}
              >
                <SelectTrigger className="mt-2 h-14 w-full px-4 py-3 text-base bg-white border border-[#D2C9BD] rounded-xl focus:border-[#203954] focus:ring-2 focus:ring-[#203954] focus:ring-offset-0">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {relationshipOptions.map((rel) => (
                    <SelectItem key={rel.label} value={rel.label} className="text-base">
                      {rel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label
                htmlFor="message"
                className="text-base font-medium text-[#1F1F1F]"
              >
                Personal Message{" "}
                <span className="text-[#8A8378] font-normal">(Optional)</span>
              </Label>
              <Textarea
                id="message"
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                className="mt-2 min-h-[88px] w-full px-4 py-3 text-base bg-white border border-[#D2C9BD] rounded-xl placeholder:text-[#8A8378] focus:border-[#203954] focus:ring-2 focus:ring-[#203954] focus:ring-offset-0"
                placeholder="Add a personal message to your invitation..."
                rows={3}
              />
            </div>

            <Separator className="bg-[#D2C9BD]" />

            <div className="space-y-2.5">
              <Label className="text-sm font-medium text-[#4A4A4A]">
                Or share invite link:
              </Label>
              <Button
                type="button"
                variant="outline"
                onClick={handleCopyInviteLink}
                className="w-full min-h-[48px] px-5 py-2.5 bg-white text-[#1F1F1F] text-base font-medium border border-[#D2C9BD] rounded-xl hover:bg-[#EFE6DA] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#203954] transition-all duration-200 justify-start"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-5 h-5 mr-2 text-[#166534]" />
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

            <DialogFooter className="gap-3 flex-col sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => setInviteDialogOpen(false)}
                className="w-full min-h-[48px] px-5 py-2.5 bg-white text-[#1F1F1F] text-base font-medium border border-[#D2C9BD] rounded-xl hover:bg-[#EFE6DA] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#203954] transition-all duration-300"
              >
                Cancel
              </Button>
              <Button
                ref={sendButtonRef}
                type="submit"
                disabled={inviteMutation.isPending}
                className="w-full min-h-[60px] px-7 py-4 bg-[#203954] text-white text-lg font-medium rounded-xl shadow-md hover:shadow-lg hover:bg-[#1B3047] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#203954] transition-all duration-300"
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
