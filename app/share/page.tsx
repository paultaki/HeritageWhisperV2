"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Share2, Copy, Trash2, Eye, Edit, Mail, Calendar, CheckCircle, XCircle } from "lucide-react";

interface Share {
  id: string;
  sharedWithEmail: string;
  permissionLevel: string;
  shareToken: string;
  createdAt: string;
  expiresAt: string | null;
  isActive: boolean;
}

export default function ShareManagement() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [permissionLevel, setPermissionLevel] = useState("view");
  const [expiresIn, setExpiresIn] = useState("");

  // Fetch existing shares
  const { data: sharesData, isLoading } = useQuery({
    queryKey: ["/api/share"],
    enabled: !!user,
  });

  const shares: Share[] = sharesData?.shares || [];

  // Create share mutation
  const createShareMutation = useMutation({
    mutationFn: async (data: { email: string; permissionLevel: string; expiresAt?: string }) => {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create share");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Share link created!",
        description: `${email} can now access your timeline`,
      });
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/share"] });

      // Copy link to clipboard
      if (data.shareUrl) {
        navigator.clipboard.writeText(data.shareUrl);
        toast({
          title: "Link copied!",
          description: "Share link copied to clipboard",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete share mutation
  const deleteShareMutation = useMutation({
    mutationFn: async (shareId: string) => {
      const res = await fetch(`/api/share/${shareId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete share");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Access revoked",
        description: "Share link has been deactivated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/share"] });
    },
  });

  const handleCreateShare = () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    const expiresAt = expiresIn
      ? new Date(Date.now() + parseInt(expiresIn) * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    createShareMutation.mutate({ email, permissionLevel, expiresAt });
  };

  const copyShareLink = (token: string) => {
    const shareUrl = `${window.location.origin}/shared/${token}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied!",
      description: "Share link copied to clipboard",
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please sign in to manage sharing</p>
          <Button onClick={() => router.push("/auth/login")}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen album-texture p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Share2 className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Share Your Timeline</h1>
            <p className="text-muted-foreground">Invite family and friends to view or collaborate on your stories</p>
          </div>
        </div>

        {/* Create New Share */}
        <Card>
          <CardHeader>
            <CardTitle>Create Share Link</CardTitle>
            <CardDescription>Invite someone to access your timeline</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="flex gap-2 mt-2">
                <div className="flex-1 relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="friend@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="permission">Permission Level</Label>
                <Select value={permissionLevel} onValueChange={setPermissionLevel}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <span>View Only - Can browse timeline</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="edit">
                      <div className="flex items-center gap-2">
                        <Edit className="w-4 h-4" />
                        <span>Edit - Can add stories and photos</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expires">Link Expires</Label>
                <Select value={expiresIn} onValueChange={setExpiresIn}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Never" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Never</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleCreateShare}
              disabled={createShareMutation.isPending}
              className="w-full"
            >
              {createShareMutation.isPending ? "Creating..." : "Create Share Link"}
            </Button>
          </CardContent>
        </Card>

        {/* Existing Shares */}
        <Card>
          <CardHeader>
            <CardTitle>Active Shares ({shares.length})</CardTitle>
            <CardDescription>People who have access to your timeline</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : shares.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Share2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No shares yet. Create one to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shares.map((share) => (
                  <div key={share.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{share.sharedWithEmail}</span>
                        {share.permissionLevel === "view" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            <Eye className="w-3 h-3" />
                            View Only
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            <Edit className="w-3 h-3" />
                            Can Edit
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>Created {new Date(share.createdAt).toLocaleDateString()}</span>
                        {share.expiresAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Expires {new Date(share.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyShareLink(share.shareToken)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteShareMutation.mutate(share.id)}
                        disabled={deleteShareMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
