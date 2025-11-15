"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  XCircle, 
  Filter,
  ArrowUpDown,
  Sparkles,
  Users,
  Clock
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Prompt {
  id: string;
  user_id: string;
  prompt_text: string;
  context_note: string | null;
  anchor_entity: string | null;
  anchor_year: number | null;
  tier: number;
  memory_type: string | null;
  prompt_score: number;
  score_reason: string | null;
  model_version: string;
  created_at: string;
  expires_at: string;
  is_locked: boolean;
  shown_count: number;
  word_count?: number;
  validation_status?: "pass" | "fail";
  validation_issues?: string[];
}

interface PromptStats {
  total: number;
  tier1: number;
  tier3: number;
  avgScore: number;
  locked: number;
}

export default function PromptQualityDashboard() {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [stats, setStats] = useState<PromptStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [tierFilter, setTierFilter] = useState<"all" | 1 | 3>("all");
  const [scoreFilter, setScoreFilter] = useState<"all" | "high" | "low">("all");
  const [sortBy, setSortBy] = useState<"created" | "score">("created");

  useEffect(() => {
    if (user) {
      loadPrompts();
    }
  }, [user]);

  const loadPrompts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest("GET", "/api/admin/prompts");
      const data = await response.json();
      
      if (data.success) {
        setPrompts(data.prompts);
        setStats(data.stats);
      } else {
        setError(data.error || "Failed to load prompts");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPrompts = prompts
    .filter((p) => {
      if (tierFilter !== "all" && p.tier !== tierFilter) return false;
      if (scoreFilter === "high" && p.prompt_score < 70) return false;
      if (scoreFilter === "low" && p.prompt_score >= 70) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "score") {
        return b.prompt_score - a.prompt_score;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  if (!user) {
    return (
      <div className="hw-page flex items-center justify-center p-4 bg-[#FFF8F3]">
        <p className="text-gray-600">Please sign in to access admin tools</p>
      </div>
    );
  }

  return (
    <div className="hw-page bg-[#FFF8F3] py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-heritage-brown mb-2">
              Prompt Quality Dashboard
            </h1>
            <p className="text-gray-600">
              Monitor prompt quality, scores, and validation across all users
            </p>
          </div>
          <Button onClick={loadPrompts} variant="outline" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Refresh
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {stats.total}
                  </div>
                  <div className="text-sm text-gray-600">Total Prompts</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {stats.tier1}
                  </div>
                  <div className="text-sm text-gray-600">Tier 1</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {stats.tier3}
                  </div>
                  <div className="text-sm text-gray-600">Tier 3</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {stats.avgScore}
                  </div>
                  <div className="text-sm text-gray-600">Avg Score</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600 mb-1">
                    {stats.locked}
                  </div>
                  <div className="text-sm text-gray-600">Locked</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {/* Tier Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tier</label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={tierFilter === "all" ? "default" : "outline"}
                    onClick={() => setTierFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant={tierFilter === 1 ? "default" : "outline"}
                    onClick={() => setTierFilter(1)}
                  >
                    Tier 1
                  </Button>
                  <Button
                    size="sm"
                    variant={tierFilter === 3 ? "default" : "outline"}
                    onClick={() => setTierFilter(3)}
                  >
                    Tier 3
                  </Button>
                </div>
              </div>

              {/* Score Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Score</label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={scoreFilter === "all" ? "default" : "outline"}
                    onClick={() => setScoreFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant={scoreFilter === "high" ? "default" : "outline"}
                    onClick={() => setScoreFilter("high")}
                  >
                    High (70+)
                  </Button>
                  <Button
                    size="sm"
                    variant={scoreFilter === "low" ? "default" : "outline"}
                    onClick={() => setScoreFilter("low")}
                  >
                    Low (&lt;70)
                  </Button>
                </div>
              </div>

              {/* Sort */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Sort By</label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={sortBy === "created" ? "default" : "outline"}
                    onClick={() => setSortBy("created")}
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    Recent
                  </Button>
                  <Button
                    size="sm"
                    variant={sortBy === "score" ? "default" : "outline"}
                    onClick={() => setSortBy("score")}
                  >
                    <ArrowUpDown className="w-4 h-4 mr-1" />
                    Score
                  </Button>
                </div>
              </div>
            </div>
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

        {/* Prompts List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Prompts ({filteredPrompts.length})
              </h2>
            </div>

            {filteredPrompts.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  No prompts found matching filters
                </CardContent>
              </Card>
            ) : (
              filteredPrompts.map((prompt) => (
                <Card key={prompt.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Prompt Text */}
                      <div>
                        <p className="text-lg italic text-gray-800 mb-2">
                          "{prompt.prompt_text}"
                        </p>
                        {prompt.context_note && (
                          <p className="text-sm text-gray-500">
                            Context: {prompt.context_note}
                          </p>
                        )}
                      </div>

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500 mb-1">Tier</div>
                          <div className="font-medium flex items-center gap-1">
                            {prompt.tier === 3 ? (
                              <Sparkles className="w-4 h-4 text-purple-600" />
                            ) : (
                              <Users className="w-4 h-4 text-blue-600" />
                            )}
                            Tier {prompt.tier}
                          </div>
                        </div>

                        <div>
                          <div className="text-gray-500 mb-1">Score</div>
                          <div
                            className={`font-medium ${
                              prompt.prompt_score >= 80
                                ? "text-green-600"
                                : prompt.prompt_score >= 60
                                ? "text-amber-600"
                                : "text-red-600"
                            }`}
                          >
                            {prompt.prompt_score}/100
                          </div>
                        </div>

                        <div>
                          <div className="text-gray-500 mb-1">Entity</div>
                          <div className="font-medium text-gray-700">
                            {prompt.anchor_entity || "—"}
                          </div>
                        </div>

                        <div>
                          <div className="text-gray-500 mb-1">Shown</div>
                          <div className="font-medium text-gray-700">
                            {prompt.shown_count}x
                          </div>
                        </div>

                        <div>
                          <div className="text-gray-500 mb-1">Model</div>
                          <div className="font-medium text-gray-700 text-xs">
                            {prompt.model_version}
                          </div>
                        </div>

                        <div>
                          <div className="text-gray-500 mb-1">Year</div>
                          <div className="font-medium text-gray-700">
                            {prompt.anchor_year || "—"}
                          </div>
                        </div>

                        <div>
                          <div className="text-gray-500 mb-1">Status</div>
                          <div className="flex items-center gap-1">
                            {prompt.is_locked ? (
                              <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded">
                                Locked
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                                Active
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="text-gray-500 mb-1">Created</div>
                          <div className="font-medium text-gray-700 text-xs">
                            {new Date(prompt.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {/* Score Reason */}
                      {prompt.score_reason && (
                        <div className="pt-3 border-t">
                          <div className="text-xs text-gray-500 mb-1">Score Reason:</div>
                          <div className="text-sm text-gray-700">
                            {prompt.score_reason}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
