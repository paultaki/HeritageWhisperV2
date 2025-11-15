"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Copy, UserPlus, Users, CheckCircle, XCircle, Clock, Ban, Search } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

interface BetaCode {
  id: string;
  code: string;
  issued_to_user_id: string | null;
  issued_to_email?: string;
  used_by_user_id: string | null;
  used_by_email?: string;
  created_at: string;
  used_at: string | null;
  expires_at: string | null;
  revoked: boolean;
}

interface Metrics {
  total: number;
  unused: number;
  used: number;
  revoked: number;
  signups7d: number;
  signups30d: number;
}

export default function AdminBetaPage() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<Metrics>({
    total: 0,
    unused: 0,
    used: 0,
    revoked: 0,
    signups7d: 0,
    signups30d: 0,
  });
  const [codes, setCodes] = useState<BetaCode[]>([]);
  const [filteredCodes, setFilteredCodes] = useState<BetaCode[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [genericCount, setGenericCount] = useState("5");
  const [genericExpiry, setGenericExpiry] = useState("");
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const [userCodeCount, setUserCodeCount] = useState("3");
  const [userCodeExpiry, setUserCodeExpiry] = useState("");
  const [generating, setGenerating] = useState(false);
  
  // Search/filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "unused" | "used" | "revoked" | "expired">("all");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [codes, searchTerm, statusFilter]);

  const fetchData = async () => {
    try {
      // Fetch all beta codes with user emails
      const { data: codesData, error: codesError } = await supabaseAdmin
        .from("beta_codes")
        .select(`
          *,
          issued_to:issued_to_user_id(email),
          used_by:used_by_user_id(email)
        `)
        .order("created_at", { ascending: false });

      if (codesError) throw codesError;

      // Transform data to include emails
      const transformedCodes = (codesData || []).map((code: any) => ({
        ...code,
        issued_to_email: code.issued_to?.email,
        used_by_email: code.used_by?.email,
      }));

      setCodes(transformedCodes);

      // Calculate metrics
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const newMetrics = {
        total: transformedCodes.length,
        unused: transformedCodes.filter((c: BetaCode) => 
          !c.used_by_user_id && !c.revoked && 
          (!c.expires_at || new Date(c.expires_at) > now)
        ).length,
        used: transformedCodes.filter((c: BetaCode) => c.used_by_user_id !== null).length,
        revoked: transformedCodes.filter((c: BetaCode) => c.revoked).length,
        signups7d: transformedCodes.filter((c: BetaCode) => 
          c.used_at && new Date(c.used_at) > sevenDaysAgo
        ).length,
        signups30d: transformedCodes.filter((c: BetaCode) => 
          c.used_at && new Date(c.used_at) > thirtyDaysAgo
        ).length,
      };

      setMetrics(newMetrics);
    } catch (error) {
      console.error("Error fetching beta codes:", error);
      toast({
        title: "Error",
        description: "Failed to load beta codes data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...codes];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(code =>
        code.code.toLowerCase().includes(term) ||
        code.issued_to_email?.toLowerCase().includes(term) ||
        code.used_by_email?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    const now = new Date();
    filtered = filtered.filter(code => {
      if (statusFilter === "unused") {
        return !code.used_by_user_id && !code.revoked && 
               (!code.expires_at || new Date(code.expires_at) > now);
      } else if (statusFilter === "used") {
        return code.used_by_user_id !== null;
      } else if (statusFilter === "revoked") {
        return code.revoked;
      } else if (statusFilter === "expired") {
        return code.expires_at && new Date(code.expires_at) < now && !code.used_by_user_id;
      }
      return true; // "all"
    });

    setFilteredCodes(filtered);
  };

  const generateGenericCodes = async () => {
    const count = parseInt(genericCount);
    if (isNaN(count) || count < 1 || count > 100) {
      toast({
        title: "Invalid count",
        description: "Please enter a number between 1 and 100",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/admin/beta/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count,
          expiresAt: genericExpiry || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate codes");
      }

      setGeneratedCodes(data.codes);
      toast({
        title: "Success",
        description: `Generated ${data.codes.length} beta codes`,
      });

      // Refresh data
      await fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate codes",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const generateUserCodes = async () => {
    if (!userEmail) {
      toast({
        title: "Email required",
        description: "Please enter a user email",
        variant: "destructive",
      });
      return;
    }

    const count = parseInt(userCodeCount);
    if (isNaN(count) || count < 1 || count > 20) {
      toast({
        title: "Invalid count",
        description: "Please enter a number between 1 and 20",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/admin/beta/generate-for-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          count,
          expiresAt: userCodeExpiry || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate codes");
      }

      setGeneratedCodes(data.codes);
      toast({
        title: "Success",
        description: `Generated ${data.codes.length} codes for ${userEmail}`,
      });

      // Reset form
      setUserEmail("");
      await fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate codes",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const revokeCode = async (codeId: string) => {
    if (!confirm("Are you sure you want to revoke this code?")) return;

    try {
      const response = await fetch("/api/admin/beta/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codeId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to revoke code");
      }

      toast({
        title: "Success",
        description: "Code revoked successfully",
      });

      await fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to revoke code",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy code",
        variant: "destructive",
      });
    }
  };

  const copyAllCodes = async () => {
    if (generatedCodes.length === 0) return;
    
    try {
      await navigator.clipboard.writeText(generatedCodes.join("\n"));
      toast({
        title: "Copied!",
        description: `Copied all ${generatedCodes.length} codes`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy codes",
        variant: "destructive",
      });
    }
  };

  const getCodeStatus = (code: BetaCode) => {
    const now = new Date();
    
    if (code.revoked) {
      return { label: "Revoked", color: "text-red-700 bg-red-50", icon: Ban };
    }
    if (code.expires_at && new Date(code.expires_at) < now && !code.used_by_user_id) {
      return { label: "Expired", color: "text-gray-700 bg-gray-50", icon: Clock };
    }
    if (code.used_by_user_id) {
      return { label: "Used", color: "text-green-700 bg-green-50", icon: CheckCircle };
    }
    return { label: "Unused", color: "text-blue-700 bg-blue-50", icon: UserPlus };
  };

  return (
    <div className="hw-page bg-[#FFF8F3] min-h-screen py-8 px-4 pt-20 lg:pt-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-serif font-bold text-heritage-brown">
            Beta Codes Management
          </h1>
          <p className="text-lg text-gray-600">
            Manage invite codes for private beta access
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{metrics.total}</div>
                <div className="text-sm text-gray-600 mt-1">Total Codes</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{metrics.unused}</div>
                <div className="text-sm text-gray-600 mt-1">Unused</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{metrics.used}</div>
                <div className="text-sm text-gray-600 mt-1">Used</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{metrics.revoked}</div>
                <div className="text-sm text-gray-600 mt-1">Revoked</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{metrics.signups7d}</div>
                <div className="text-sm text-gray-600 mt-1">Last 7 Days</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{metrics.signups30d}</div>
                <div className="text-sm text-gray-600 mt-1">Last 30 Days</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Code Generation Forms */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Generate Generic Codes */}
          <Card>
            <CardHeader>
              <CardTitle>Generate Generic Codes</CardTitle>
              <CardDescription>
                Create codes not assigned to any user for manual distribution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="genericCount">Number of codes</Label>
                <Input
                  id="genericCount"
                  type="number"
                  value={genericCount}
                  onChange={(e) => setGenericCount(e.target.value)}
                  min="1"
                  max="100"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="genericExpiry">Expiry date (optional)</Label>
                <Input
                  id="genericExpiry"
                  type="date"
                  value={genericExpiry}
                  onChange={(e) => setGenericExpiry(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button 
                onClick={generateGenericCodes} 
                disabled={generating}
                className="w-full"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {generating ? "Generating..." : "Generate Codes"}
              </Button>
            </CardContent>
          </Card>

          {/* Generate Codes for User */}
          <Card>
            <CardHeader>
              <CardTitle>Generate Codes for User</CardTitle>
              <CardDescription>
                Create codes assigned to a specific user by email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="userEmail">User email</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="userCodeCount">Number of codes</Label>
                <Input
                  id="userCodeCount"
                  type="number"
                  value={userCodeCount}
                  onChange={(e) => setUserCodeCount(e.target.value)}
                  min="1"
                  max="20"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="userCodeExpiry">Expiry date (optional)</Label>
                <Input
                  id="userCodeExpiry"
                  type="date"
                  value={userCodeExpiry}
                  onChange={(e) => setUserCodeExpiry(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button 
                onClick={generateUserCodes} 
                disabled={generating}
                className="w-full"
              >
                <Users className="h-4 w-4 mr-2" />
                {generating ? "Generating..." : "Generate for User"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Generated Codes Display */}
        {generatedCodes.length > 0 && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-green-900">
                  Generated {generatedCodes.length} Codes
                </CardTitle>
                <Button onClick={copyAllCodes} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {generatedCodes.map((code, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-white rounded border"
                  >
                    <code className="font-mono font-bold">{code}</code>
                    <Button
                      onClick={() => copyToClipboard(code)}
                      variant="ghost"
                      size="sm"
                      className="ml-2"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by code or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {["all", "unused", "used", "revoked", "expired"].map((status) => (
                  <Button
                    key={status}
                    onClick={() => setStatusFilter(status as any)}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Codes Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Beta Codes ({filteredCodes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-gray-500 py-8">Loading codes...</p>
            ) : filteredCodes.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No codes found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Code</th>
                      <th className="text-left py-3 px-2">Status</th>
                      <th className="text-left py-3 px-2">Issued To</th>
                      <th className="text-left py-3 px-2">Used By</th>
                      <th className="text-left py-3 px-2">Created</th>
                      <th className="text-left py-3 px-2">Used</th>
                      <th className="text-right py-3 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCodes.map((code) => {
                      const status = getCodeStatus(code);
                      const StatusIcon = status.icon;
                      const isUnused = !code.used_by_user_id && !code.revoked &&
                                     (!code.expires_at || new Date(code.expires_at) > new Date());
                      
                      return (
                        <tr key={code.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-2">
                            <code className="font-mono font-bold">{code.code}</code>
                          </td>
                          <td className="py-3 px-2">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                              <StatusIcon className="h-3 w-3" />
                              {status.label}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-sm text-gray-600">
                            {code.issued_to_email || <span className="text-gray-400">Generic</span>}
                          </td>
                          <td className="py-3 px-2 text-sm text-gray-600">
                            {code.used_by_email || <span className="text-gray-400">—</span>}
                          </td>
                          <td className="py-3 px-2 text-sm text-gray-600">
                            {new Date(code.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-2 text-sm text-gray-600">
                            {code.used_at ? new Date(code.used_at).toLocaleDateString() : <span className="text-gray-400">—</span>}
                          </td>
                          <td className="py-3 px-2 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isUnused && (
                                <>
                                  <Button
                                    onClick={() => copyToClipboard(code.code)}
                                    variant="ghost"
                                    size="sm"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    onClick={() => revokeCode(code.id)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Ban className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
