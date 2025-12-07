"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface StoryToFix {
  id: string;
  title: string;
  audioUrl: string;
  currentDuration: number;
  detectedDuration?: number;
  status: "pending" | "detecting" | "detected" | "updating" | "fixed" | "error";
  error?: string;
}

export default function FixDurationsPage() {
  const [stories, setStories] = useState<StoryToFix[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch stories with 1-second duration
  const fetchStories = async () => {
    setIsLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        alert("Please log in first");
        return;
      }

      const response = await fetch("/api/admin/stories-to-fix", {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch stories");
      }

      const data = await response.json();
      setStories(
        data.stories.map((s: any) => ({
          id: s.id,
          title: s.title,
          audioUrl: s.audioUrl,
          currentDuration: s.durationSeconds,
          status: "pending" as const,
        }))
      );
    } catch (error) {
      console.error("Error fetching stories:", error);
      alert("Failed to fetch stories. Make sure you're logged in as admin.");
    } finally {
      setIsLoading(false);
    }
  };

  // Detect duration for a single story using browser audio element
  const detectDuration = (story: StoryToFix): Promise<number> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.preload = "metadata";

      const timeout = setTimeout(() => {
        audio.src = "";
        reject(new Error("Timeout loading audio"));
      }, 15000);

      audio.onloadedmetadata = () => {
        clearTimeout(timeout);
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
          resolve(Math.round(audio.duration));
        } else {
          reject(new Error("Invalid duration"));
        }
        audio.src = "";
      };

      audio.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Failed to load audio"));
        audio.src = "";
      };

      audio.src = story.audioUrl;
    });
  };

  // Update a story's duration in the database
  const updateDuration = async (storyId: string, duration: number) => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.access_token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`/api/stories/${storyId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.session.access_token}`,
      },
      body: JSON.stringify({ durationSeconds: duration }),
    });

    if (!response.ok) {
      throw new Error("Failed to update story");
    }
  };

  // Process all stories
  const processAll = async () => {
    setIsProcessing(true);
    setProcessedCount(0);

    for (let i = 0; i < stories.length; i++) {
      const story = stories[i];

      // Update status to detecting
      setStories((prev) =>
        prev.map((s) => (s.id === story.id ? { ...s, status: "detecting" } : s))
      );

      try {
        // Detect duration
        const duration = await detectDuration(story);

        // Update status with detected duration
        setStories((prev) =>
          prev.map((s) =>
            s.id === story.id
              ? { ...s, detectedDuration: duration, status: "updating" }
              : s
          )
        );

        // Update in database
        await updateDuration(story.id, duration);

        // Mark as fixed
        setStories((prev) =>
          prev.map((s) => (s.id === story.id ? { ...s, status: "fixed" } : s))
        );
      } catch (error) {
        console.error(`Error processing ${story.title}:`, error);
        setStories((prev) =>
          prev.map((s) =>
            s.id === story.id
              ? {
                  ...s,
                  status: "error",
                  error: error instanceof Error ? error.message : "Unknown error",
                }
              : s
          )
        );
      }

      setProcessedCount(i + 1);

      // Small delay between stories to avoid overwhelming the browser
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setIsProcessing(false);
  };

  // Process a single story
  const processSingle = async (storyId: string) => {
    const story = stories.find((s) => s.id === storyId);
    if (!story) return;

    setStories((prev) =>
      prev.map((s) => (s.id === storyId ? { ...s, status: "detecting" } : s))
    );

    try {
      const duration = await detectDuration(story);

      setStories((prev) =>
        prev.map((s) =>
          s.id === storyId
            ? { ...s, detectedDuration: duration, status: "updating" }
            : s
        )
      );

      await updateDuration(storyId, duration);

      setStories((prev) =>
        prev.map((s) => (s.id === storyId ? { ...s, status: "fixed" } : s))
      );
    } catch (error) {
      console.error(`Error processing ${story.title}:`, error);
      setStories((prev) =>
        prev.map((s) =>
          s.id === storyId
            ? {
                ...s,
                status: "error",
                error: error instanceof Error ? error.message : "Unknown error",
              }
            : s
        )
      );
    }
  };

  const fixedCount = stories.filter((s) => s.status === "fixed").length;
  const errorCount = stories.filter((s) => s.status === "error").length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Fix Audio Durations
        </h1>
        <p className="text-gray-600 mb-8">
          This tool detects actual audio durations using the browser and updates
          the database.
        </p>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex gap-4 items-center">
            <button
              onClick={fetchStories}
              disabled={isLoading || isProcessing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Loading..." : "Load Stories to Fix"}
            </button>

            {stories.length > 0 && (
              <button
                onClick={processAll}
                disabled={isProcessing || fixedCount === stories.length}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing
                  ? `Processing ${processedCount}/${stories.length}...`
                  : "Fix All Durations"}
              </button>
            )}
          </div>

          {stories.length > 0 && (
            <div className="mt-4 text-sm text-gray-600">
              Found {stories.length} stories with 1-second duration |{" "}
              <span className="text-green-600">{fixedCount} fixed</span> |{" "}
              <span className="text-red-600">{errorCount} errors</span>
            </div>
          )}
        </div>

        {/* Stories List */}
        {stories.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detected
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stories.map((story) => (
                  <tr key={story.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                        {story.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {story.currentDuration}s
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {story.detectedDuration
                        ? `${story.detectedDuration}s`
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          story.status === "fixed"
                            ? "bg-green-100 text-green-800"
                            : story.status === "error"
                              ? "bg-red-100 text-red-800"
                              : story.status === "detecting" ||
                                  story.status === "updating"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {story.status}
                        {story.error && `: ${story.error}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {story.status !== "fixed" && (
                        <button
                          onClick={() => processSingle(story.id)}
                          disabled={
                            isProcessing ||
                            story.status === "detecting" ||
                            story.status === "updating"
                          }
                          className="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50"
                        >
                          Fix
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Hidden audio element for duration detection */}
        <audio ref={audioRef} className="hidden" />
      </div>
    </div>
  );
}
