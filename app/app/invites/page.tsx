"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, CheckCircle, XCircle, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface BetaCode {
  id: string;
  code: string;
  used_by_user_id: string | null;
  used_at: string | null;
  expires_at: string | null;
  revoked: boolean;
  created_at: string;
}

export default function InvitesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [codes, setCodes] = useState<BetaCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCodes();
    }
  }, [user]);

  const fetchCodes = async () => {
    try {
      const { data, error } = await supabase
        .from("beta_codes")
        .select("*")
        .eq("issued_to_user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setCodes(data || []);
    } catch (error) {
      console.error("Error fetching beta codes:", error);
      toast({
        title: "Error",
        description: "Failed to load your invite codes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Copied!",
        description: "Beta code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy code",
        variant: "destructive",
      });
    }
  };

  const getStatusInfo = (code: BetaCode) => {
    if (code.revoked) {
      return {
        label: "Revoked",
        icon: <XCircle className="h-4 w-4 text-red-500" />,
        color: "text-red-700 bg-red-50",
      };
    }

    if (code.expires_at && new Date(code.expires_at) < new Date()) {
      return {
        label: "Expired",
        icon: <Clock className="h-4 w-4 text-gray-500" />,
        color: "text-gray-700 bg-gray-50",
      };
    }

    if (code.used_by_user_id) {
      const usedDate = new Date(code.used_at!).toLocaleDateString();
      return {
        label: `Used on ${usedDate}`,
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        color: "text-green-700 bg-green-50",
      };
    }

    return {
      label: "Unused",
      icon: <CheckCircle className="h-4 w-4 text-blue-500" />,
      color: "text-blue-700 bg-blue-50",
    };
  };

  if (!user) {
    return (
      <div className="hw-page flex items-center justify-center p-4 bg-[#FFF8F3]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Please sign in to view your invite codes</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="hw-page bg-[#FFF8F3] min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-serif font-bold text-heritage-brown">
            Your Invite Codes
          </h1>
          <p className="text-lg text-gray-600">
            Share these codes with friends and family to invite them to HeritageWhisper
          </p>
        </div>

        {/* Codes List */}
        {loading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">Loading your codes...</p>
            </CardContent>
          </Card>
        ) : codes.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">
                No invite codes available yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {codes.map((code) => {
              const status = getStatusInfo(code);
              const isUnused = !code.used_by_user_id && !code.revoked && 
                              (!code.expires_at || new Date(code.expires_at) > new Date());

              return (
                <Card key={code.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <code className="text-2xl font-mono font-bold text-heritage-brown tracking-wider">
                            {code.code}
                          </code>
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                            {status.icon}
                            <span>{status.label}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">
                          Created {new Date(code.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {isUnused && (
                        <Button
                          onClick={() => copyToClipboard(code.code)}
                          variant="outline"
                          className="ml-4"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900">How it works</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Each code can only be used once</li>
              <li>• Share codes with people you'd like to join HeritageWhisper</li>
              <li>• Once a code is used, it will show as "Used" above</li>
              <li>• New users will automatically receive their own invite codes to share</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
