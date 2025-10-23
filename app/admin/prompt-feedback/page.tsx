"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ThumbsUp,
  ThumbsDown,
  Download,
  Filter,
  XCircle,
} from "lucide-react";

interface Prompt {
  id: string;
  prompt_text: string;
  context_note: string | null;
  tier: number;
  memory_type: string;
  anchor_entity: string | null;
  anchor_year: number | null;
  prompt_score: number;
  word_count: number;
  created_at: string;
  shown_count: number;
  hasBeenReviewed: boolean;
  triggerInfo: string;
  status: string;
  milestone_reached: number | null;
  retired_at: string | null;
  answered_at: string | null;
  feedback: {
    rating: string;
    feedback_notes: string;
    tags: string[];
  } | null;
}

interface Stats {
  total: number;
  tier1: number;
  tier3: number;
  avgScore: number;
  locked: number;
  reviewed: number;
  needsReview: number;
  good: number;
  bad: number;
}

export default function AdminPromptFeedbackPage() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [filterTier, setFilterTier] = useState<string>("all");
  const [filterReviewed, setFilterReviewed] = useState<string>("unreviewed");
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Fetch all prompts
  const { data, isLoading } = useQuery<{
    prompts: Prompt[];
    stats: Stats;
  }>({
    queryKey: ["/api/admin/prompts"],
    enabled: !!session,
  });

  // Submit feedback mutation
  const submitFeedback = useMutation({
    mutationFn: async ({
      promptId,
      rating,
    }: {
      promptId: string;
      rating: string;
    }) => {
      const response = await fetch("/api/admin/prompts/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          promptId,
          rating,
          feedbackNotes,
          tags: selectedTags,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback submitted",
        description: "Thank you for reviewing this prompt!",
      });
      setSelectedPrompt(null);
      setFeedbackNotes("");
      setSelectedTags([]);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prompts"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  // Export data
  const handleExport = async (format: string) => {
    const url = `/api/admin/prompts/export?format=${format}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
      },
    });

    if (!response.ok) {
      toast({
        title: "Export failed",
        variant: "destructive",
      });
      return;
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `prompt-feedback-${Date.now()}.${format === "jsonl" ? "jsonl" : format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    a.remove();

    toast({
      title: "Export complete",
      description: `Downloaded ${format.toUpperCase()} file`,
    });
  };

  // Filter prompts
  const filteredPrompts = data?.prompts?.filter((p) => {
    if (filterTier !== "all" && p.tier !== parseInt(filterTier)) return false;
    if (filterReviewed === "reviewed" && !p.hasBeenReviewed) return false;
    if (filterReviewed === "unreviewed" && p.hasBeenReviewed) return false;
    return true;
  });

  const stats = data?.stats;

  // Available tags
  const commonTags = [
    "generic",
    "no-context",
    "body-part",
    "placeholder-response",
    "yes-no-question",
    "therapy-speak",
    "perfect",
    "needs-improvement",
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Prompt Quality Feedback</h1>
        <p className="text-gray-600">
          Review AI-generated prompts and provide feedback for model improvement
        </p>
      </div>

      {/* How It Works Section */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <h2 className="text-xl font-bold mb-4 text-blue-900">📚 How AI Prompt Generation Works</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">🎯 Tier 1: Entity-Based Prompts</h3>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Trigger:</strong> Generated after EVERY story save
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Extracts 1-3 entities (people, places, objects, concepts) from the story and generates reflection prompts using template library.
              </p>
              <p className="text-xs text-gray-500">
                Categories: Appreciation, Perspective Shifts, Unfinished Business, Invisible Rules, Future Self
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 mb-2">🌟 Tier 3: Milestone Analysis</h3>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Trigger:</strong> At story milestones [1, 2, 3, 4, 7, 10, 15, 20, 30, 50, 100]
              </p>
              <p className="text-sm text-gray-600 mb-2">
                GPT-5 analyzes entire story collection for patterns, themes, and character evolution. Generates deep reflection prompts.
              </p>
              <p className="text-xs text-gray-500">
                Extracts character traits, invisible rules, contradictions, and core lessons
              </p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> Both tiers use SHA1 deduplication to prevent duplicate prompts. Tier 1 prompts expire after 7 days if not answered. Tier 3 prompts never expire.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-sm text-gray-600">Total Prompts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {stats?.good || 0}
            </div>
            <p className="text-sm text-gray-600">Good/Excellent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {stats?.bad || 0}
            </div>
            <p className="text-sm text-gray-600">Bad/Terrible</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {stats?.reviewed || 0}
            </div>
            <p className="text-sm text-gray-600">Reviewed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {stats?.needsReview || 0}
            </div>
            <p className="text-sm text-gray-600">Needs Review</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Export */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Select value={filterTier} onValueChange={setFilterTier}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="1">Tier 1</SelectItem>
            <SelectItem value="3">Tier 3</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterReviewed} onValueChange={setFilterReviewed}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Prompts</SelectItem>
            <SelectItem value="reviewed">Reviewed Only</SelectItem>
            <SelectItem value="unreviewed">Needs Review</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("json")}
          >
            <Download className="w-4 h-4 mr-2" />
            JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("csv")}
          >
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("jsonl")}
          >
            <Download className="w-4 h-4 mr-2" />
            JSONL (Training)
          </Button>
        </div>
      </div>

      {/* Prompts List */}
      <div className="space-y-4">
        {filteredPrompts?.map((prompt) => (
          <Card
            key={prompt.id}
            className={`${
              prompt.hasBeenReviewed
                ? "border-l-4 " +
                  (prompt.feedback?.rating === "good" ||
                  prompt.feedback?.rating === "excellent"
                    ? "border-l-green-500"
                    : "border-l-red-500")
                : ""
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-lg font-medium mb-3">
                    {prompt.prompt_text}
                  </p>

                  {/* Trigger & Status Info */}
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      🎯 Trigger: {prompt.triggerInfo}
                    </p>
                    <p className="text-xs text-blue-700">
                      Status: <strong>{prompt.status}</strong> •
                      Created: {new Date(prompt.created_at).toLocaleDateString()}
                      {prompt.milestone_reached && ` • Milestone: Story ${prompt.milestone_reached}`}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                    <Badge variant="outline">Tier {prompt.tier}</Badge>
                    <Badge variant="outline">{prompt.memory_type}</Badge>
                    {prompt.anchor_entity && (
                      <Badge variant="outline">
                        Entity: {prompt.anchor_entity}
                      </Badge>
                    )}
                    <Badge variant="outline">
                      Score: {prompt.prompt_score}
                    </Badge>
                    <Badge variant="outline">
                      {prompt.word_count} words
                    </Badge>
                  </div>
                </div>

                {prompt.hasBeenReviewed ? (
                  <div className="ml-4">
                    <Badge
                      className={
                        prompt.feedback?.rating === "good" ||
                        prompt.feedback?.rating === "excellent"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {prompt.feedback?.rating.toUpperCase()}
                    </Badge>
                  </div>
                ) : (
                  <div className="ml-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:bg-green-50"
                      onClick={() => {
                        setSelectedPrompt(prompt);
                        submitFeedback.mutate({
                          promptId: prompt.id,
                          rating: "good",
                        });
                      }}
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      Good
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => setSelectedPrompt(prompt)}
                    >
                      <ThumbsDown className="w-4 h-4 mr-1" />
                      Bad
                    </Button>
                  </div>
                )}
              </div>

              {prompt.hasBeenReviewed && prompt.feedback?.feedback_notes && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                  <strong>Notes:</strong> {prompt.feedback.feedback_notes}
                </div>
              )}

              {prompt.hasBeenReviewed && prompt.feedback?.tags && prompt.feedback.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {prompt.feedback.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Feedback Modal */}
      {selectedPrompt && !selectedPrompt.hasBeenReviewed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Provide Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50 rounded">
                <p className="font-medium">{selectedPrompt.prompt_text}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Why is this bad? (optional)
                </label>
                <Textarea
                  placeholder="Explain what's wrong with this prompt..."
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Tags (select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {commonTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={() =>
                    submitFeedback.mutate({
                      promptId: selectedPrompt.id,
                      rating: "bad",
                    })
                  }
                  disabled={submitFeedback.isPending}
                >
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  Mark as Bad
                </Button>
                <Button
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  onClick={() =>
                    submitFeedback.mutate({
                      promptId: selectedPrompt.id,
                      rating: "terrible",
                    })
                  }
                  disabled={submitFeedback.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Terrible
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedPrompt(null);
                    setFeedbackNotes("");
                    setSelectedTags([]);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {filteredPrompts?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No prompts found matching your filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
