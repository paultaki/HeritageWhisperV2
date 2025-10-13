"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Copy,
  Target,
  Trash2,
  RefreshCw,
  Sparkles,
  Users,
  AlertTriangle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface TestAccount {
  id: string;
  email: string;
  name: string;
  total_stories: number;
  visible_stories: number;
  active_prompts: number;
  prompt_history: number;
  has_character_evolution: boolean;
}

const MILESTONE_OPTIONS = [1, 2, 3, 4, 7, 10, 15, 20, 30, 50];

export default function TestAccountsPage() {
  const { user } = useAuth();
  const [testAccounts, setTestAccounts] = useState<TestAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Clone form
  const [cloneEmail, setCloneEmail] = useState("");
  const [cloneName, setCloneName] = useState("");

  useEffect(() => {
    if (user) {
      loadTestAccounts();
    }
  }, [user]);

  const loadTestAccounts = async () => {
    try {
      const response = await apiRequest("GET", "/api/admin/test-accounts");
      const data = await response.json();
      
      if (data.success) {
        setTestAccounts(data.accounts);
      }
    } catch (err) {
      console.error("Failed to load test accounts:", err);
    }
  };

  const cloneAccount = async () => {
    if (!cloneEmail.trim()) {
      setError("Email is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest("POST", "/api/admin/test-accounts/clone", {
        email: cloneEmail,
        name: cloneName || undefined,
      });
      const data = await response.json();

      if (data.success) {
        alert(`✓ Test account created!\n\nEmail: ${cloneEmail}\nStories: ${data.stories_cloned}\nPhotos: ${data.photos_cloned}`);
        setCloneEmail("");
        setCloneName("");
        loadTestAccounts();
      } else {
        setError(data.error || "Clone failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const setMilestone = async (accountId: string, storyCount: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest("POST", "/api/admin/test-accounts/milestone", {
        userId: accountId,
        storyCount,
      });
      const data = await response.json();

      if (data.success) {
        alert(`✓ Milestone set to ${storyCount} stories!\n\nVisible: ${data.visible_stories}\nHidden: ${data.hidden_stories}`);
        loadTestAccounts();
      } else {
        setError(data.error || "Failed to set milestone");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const generatePrompts = async (accountId: string, accountEmail: string) => {
    if (!confirm(`Generate prompts for ${accountEmail}?\n\nThis will analyze all visible stories and generate Tier-1 and Tier-3 prompts based on current milestone.`)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest("POST", "/api/admin/test-accounts/generate-prompts", {
        userId: accountId,
      });
      const data = await response.json();

      if (data.success) {
        alert(`✓ Prompts generated!\n\nTier-1: ${data.tier1_count}\nTier-3: ${data.tier3_count}\nTotal: ${data.total_prompts}`);
        loadTestAccounts();
      } else {
        setError(data.error || "Failed to generate prompts");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const cleanPrompts = async (accountId: string, accountEmail: string) => {
    if (!confirm(`Clean all prompts for ${accountEmail}?\n\nThis will delete all active prompts, prompt history, and character evolution. Stories will remain intact.`)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest("POST", "/api/admin/test-accounts/clean", {
        userId: accountId,
      });
      const data = await response.json();

      if (data.success) {
        alert(`✓ Prompts cleaned!\n\nActive: ${data.active_deleted}\nHistory: ${data.history_deleted}\nEvolution: ${data.evolution_deleted}`);
        loadTestAccounts();
      } else {
        setError(data.error || "Failed to clean prompts");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async (accountId: string, accountEmail: string) => {
    const confirmed = prompt(
      `⚠️  DELETE TEST ACCOUNT?\n\nThis will permanently delete:\n- Account: ${accountEmail}\n- All stories\n- All photos\n- All prompts\n\nType the email to confirm:`
    );

    if (confirmed !== accountEmail) {
      alert("Deletion cancelled - email did not match");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest("POST", "/api/admin/test-accounts/delete", {
        userId: accountId,
        confirmEmail: accountEmail,
      });
      const data = await response.json();

      if (data.success) {
        alert(`✓ Test account deleted!\n\nStories: ${data.stories_deleted}\nPhotos: ${data.photos_deleted}\nPrompts: ${data.prompts_deleted}`);
        loadTestAccounts();
      } else {
        setError(data.error || "Failed to delete account");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#FFF8F3]">
        <p className="text-gray-600">Please sign in to access admin tools</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF8F3] py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-serif font-bold text-heritage-brown mb-2">
            Test Accounts
          </h1>
          <p className="text-gray-600">
            Clone your account to create test environments for milestone testing
          </p>
        </div>

        {/* Clone Account */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Copy className="w-5 h-5" />
              Clone Your Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Test Account Email
                </label>
                <Input
                  type="email"
                  placeholder="test@heritagewhisper.com"
                  value={cloneEmail}
                  onChange={(e) => setCloneEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Name (optional)
                </label>
                <Input
                  type="text"
                  placeholder="Paul (Test)"
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                />
              </div>
            </div>
            
            <Button onClick={cloneAccount} disabled={isLoading || !cloneEmail.trim()}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              Clone Account
            </Button>

            <p className="text-sm text-gray-500">
              This creates a complete copy of your account with all {user?.story_count || 0} stories and photos. 
              Prompts are NOT copied (you'll generate them fresh for testing).
            </p>
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-800">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Test Accounts List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Test Accounts ({testAccounts.length})
          </h2>

          {testAccounts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                No test accounts yet. Clone your account to get started.
              </CardContent>
            </Card>
          ) : (
            testAccounts.map((account) => (
              <Card key={account.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Account Info */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {account.name}
                        </h3>
                        <p className="text-sm text-gray-600">{account.email}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteAccount(account.id, account.email)}
                        disabled={isLoading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">
                          {account.visible_stories}
                        </div>
                        <div className="text-gray-600">Visible Stories</div>
                        <div className="text-xs text-gray-500 mt-1">
                          of {account.total_stories} total
                        </div>
                      </div>

                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {account.active_prompts}
                        </div>
                        <div className="text-gray-600">Active Prompts</div>
                      </div>

                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {account.prompt_history}
                        </div>
                        <div className="text-gray-600">History</div>
                      </div>

                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {account.has_character_evolution ? "✓" : "—"}
                        </div>
                        <div className="text-gray-600">Insights</div>
                      </div>
                    </div>

                    {/* Milestone Controls */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Set Milestone (visible stories)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {MILESTONE_OPTIONS.filter(m => m <= account.total_stories).map((milestone) => (
                          <Button
                            key={milestone}
                            size="sm"
                            variant={account.visible_stories === milestone ? "default" : "outline"}
                            onClick={() => setMilestone(account.id, milestone)}
                            disabled={isLoading}
                          >
                            Story {milestone}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generatePrompts(account.id, account.email)}
                        disabled={isLoading}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Prompts
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cleanPrompts(account.id, account.email)}
                        disabled={isLoading}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Clean Prompts
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Workflow Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">1.</span>
              <div>
                <span className="font-medium">Clone your account</span> - Creates test account with all your stories
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">2.</span>
              <div>
                <span className="font-medium">Set milestone</span> - Click "Story 3" to simulate having 3 stories (hides the rest)
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">3.</span>
              <div>
                <span className="font-medium">Generate prompts</span> - Runs Tier-1 + Tier-3 analysis for current milestone
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">4.</span>
              <div>
                <span className="font-medium">Review in dashboard</span> - Go to /admin/prompts to see generated prompts
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">5.</span>
              <div>
                <span className="font-medium">Test different milestones</span> - Clean prompts, set new milestone, regenerate
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">6.</span>
              <div>
                <span className="font-medium">Delete when done</span> - Removes test account completely
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
