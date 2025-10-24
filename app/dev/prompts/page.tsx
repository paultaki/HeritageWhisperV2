// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface Story {
  id: string;
  title: string;
  story_year: number | null;
  created_at: string;
}

interface Prompt {
  prompt: string;
  trigger: string;
  anchorEntity: string;
  recordingLikelihood: number;
  reasoning: string;
}

interface AnalysisResult {
  storyCount: number;
  storiesAnalyzed: number;
  storyTitles: string[];
  prompts: Prompt[];
  tier?: string;
}

export default function PromptsTestingPage() {
  const { session } = useAuth();
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStoryIds, setSelectedStoryIds] = useState<string[]>([]);
  const [tier, setTier] = useState<string>("tier3v2");
  const [milestone, setMilestone] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  // Fetch user stories
  useEffect(() => {
    async function fetchStories() {
      if (!session) return;

      setLoading(true);
      try {
        const response = await fetch("/api/stories", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch stories");
        }

        const data = await response.json();
        setStories(data.stories || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stories");
      } finally {
        setLoading(false);
      }
    }

    fetchStories();
  }, [session]);

  // Handle story selection toggle
  const toggleStorySelection = (storyId: string) => {
    setSelectedStoryIds((prev) =>
      prev.includes(storyId)
        ? prev.filter((id) => id !== storyId)
        : [...prev, storyId],
    );
  };

  // Select all stories
  const selectAll = () => {
    setSelectedStoryIds(stories.map((s) => s.id));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedStoryIds([]);
  };

  // Run analysis
  const runAnalysis = async () => {
    if (!session || selectedStoryIds.length === 0) return;

    setAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await fetch("/api/dev/analyze-prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          storyIds: selectedStoryIds,
          tier: tier,
          milestone: milestone ? parseInt(milestone) : null,
          dryRun: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Analysis failed");
      }

      const data = await response.json();
      setAnalysisResult({ ...data.analysis, tier: data.tier });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5E6D3]">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Authentication Required</h1>
          <button
            onClick={() => router.push("/auth/login")}
            className="px-6 py-3 bg-[#8B4513] text-white rounded-lg hover:bg-[#A0522D]"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5E6D3] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#8B4513] mb-2">
            AI Prompt Testing Suite
          </h1>
          <p className="text-[#A0522D]">
            Test your AI prompt generation system without affecting production data
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Story Selection */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#8B4513]">
                Select Stories ({selectedStoryIds.length} selected)
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="px-3 py-1 text-sm bg-[#8B4513] text-white rounded hover:bg-[#A0522D]"
                >
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Clear
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-[#A0522D]">
                Loading stories...
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2">
                {stories.map((story) => (
                  <label
                    key={story.id}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStoryIds.includes(story.id)}
                      onChange={() => toggleStorySelection(story.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-[#8B4513]">
                        {story.title || "Untitled"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {story.story_year && `Year: ${story.story_year} • `}
                        {new Date(story.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* Analysis Controls */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              {/* Tier Selection */}
              <div className="mb-6">
                <label className="block mb-3 text-sm font-medium text-[#8B4513]">
                  Select Tier System
                </label>
                <div className="space-y-3">
                  <label className={`flex items-start gap-3 p-3 border-2 rounded cursor-pointer transition-colors ${
                    tier === "tier1"
                      ? "border-[#8B4513] bg-amber-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}>
                    <input
                      type="radio"
                      name="tier"
                      value="tier1"
                      checked={tier === "tier1"}
                      onChange={(e) => setTier(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-[#8B4513]">Tier 1: Entity Templates</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Extracts 1-3 entities per story (people, places, objects) and generates prompts using template library. Runs after EVERY story save. No character insights.
                      </div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3 border-2 rounded cursor-pointer transition-colors ${
                    tier === "tier3v1"
                      ? "border-[#8B4513] bg-amber-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}>
                    <input
                      type="radio"
                      name="tier"
                      value="tier3v1"
                      checked={tier === "tier3v1"}
                      onChange={(e) => setTier(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-[#8B4513]">Tier 3 V1: Pattern Analysis</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Original milestone analysis. Analyzes patterns, gaps, and connections across all stories. Extracts character traits, invisible rules, contradictions, and core lessons.
                      </div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3 border-2 rounded cursor-pointer transition-colors ${
                    tier === "tier3v2"
                      ? "border-[#8B4513] bg-amber-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}>
                    <input
                      type="radio"
                      name="tier"
                      value="tier3v2"
                      checked={tier === "tier3v2"}
                      onChange={(e) => setTier(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-[#8B4513]">Tier 3 V2: Intimacy Engine ⭐</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Advanced milestone analysis using 4 intimacy types: "I Caught That" (exact phrases), "I See Your Pattern" (behaviors), "I Notice the Absence" (what's missing), "I Understand the Cost" (tradeoffs). Includes quality gates.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Milestone Selection */}
              <label className="block mb-2 text-sm font-medium text-[#8B4513]">
                Simulate Milestone (optional)
              </label>
              <select
                value={milestone}
                onChange={(e) => setMilestone(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded mb-4"
              >
                <option value="">Auto (use story count)</option>
                <option value="1">Story 1</option>
                <option value="2">Story 2</option>
                <option value="3">Story 3 (Paywall)</option>
                <option value="4">Story 4</option>
                <option value="7">Story 7</option>
                <option value="10">Story 10</option>
                <option value="15">Story 15</option>
                <option value="20">Story 20</option>
                <option value="30">Story 30</option>
                <option value="50">Story 50</option>
                <option value="100">Story 100</option>
              </select>

              <button
                onClick={runAnalysis}
                disabled={selectedStoryIds.length === 0 || analyzing}
                className="w-full px-6 py-3 bg-[#8B4513] text-white rounded-lg font-semibold hover:bg-[#A0522D] disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {analyzing ? "Analyzing..." : `Run ${tier === "tier1" ? "Tier 1" : tier === "tier3v1" ? "Tier 3 V1" : "Tier 3 V2"} Analysis`}
              </button>
            </div>
          </div>

          {/* Right: Analysis Results */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-[#8B4513] mb-4">
              Analysis Results
            </h2>

            {!analysisResult && !analyzing && (
              <div className="text-center py-12 text-gray-500">
                Select stories and tier system, then click "Run Analysis" to see results
              </div>
            )}

            {analyzing && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B4513] mx-auto mb-4"></div>
                <p className="text-[#A0522D]">
                  {tier === "tier1" ? "Extracting entities and generating prompts..." : "Analyzing stories with GPT-4o..."}
                </p>
              </div>
            )}

            {analysisResult && (
              <div className="space-y-6 max-h-[600px] overflow-y-auto">
                {/* Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Summary</h3>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div>
                      <span className="font-medium">Tier:</span>{" "}
                      {analysisResult.tier === "tier1"
                        ? "Tier 1 (Entity Templates)"
                        : analysisResult.tier === "tier3v1"
                        ? "Tier 3 V1 (Pattern Analysis)"
                        : "Tier 3 V2 (Intimacy Engine)"}
                    </div>
                    <div>Stories Analyzed: {analysisResult.storiesAnalyzed}</div>
                    <div>Milestone: Story {analysisResult.storyCount}</div>
                    <div>Prompts Generated: {analysisResult.prompts.length}</div>
                  </div>
                </div>

                {/* Generated Prompts */}
                <div>
                  <h3 className="font-semibold text-[#8B4513] mb-3">
                    Generated Prompts ({analysisResult.prompts.length})
                  </h3>
                  <div className="space-y-3">
                    {analysisResult.prompts.map((prompt, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="font-medium text-[#8B4513] mb-2">
                          {prompt.prompt}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>
                            <span className="font-medium">Trigger:</span> {prompt.trigger}
                          </div>
                          <div>
                            <span className="font-medium">Anchor:</span>{" "}
                            {prompt.anchorEntity}
                          </div>
                          <div>
                            <span className="font-medium">Score:</span>{" "}
                            {prompt.recordingLikelihood}/100
                          </div>
                          <div className="text-xs bg-gray-50 p-2 rounded mt-2">
                            <span className="font-medium">Reasoning:</span>{" "}
                            {prompt.reasoning}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
