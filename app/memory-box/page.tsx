"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  FileText,
  Box,
  Download,
  Printer,
  Archive,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useModeSelection } from "@/hooks/use-mode-selection";
import { ModeSelectionModal } from "@/components/recording/ModeSelectionModal";
import { QuickStoryRecorder } from "@/components/recording/QuickStoryRecorder";
import MemoryToolbar from "@/components/ui/MemoryToolbar";
import MemoryCard from "@/components/ui/MemoryCard";
import { MemoryList } from "@/components/ui/MemoryList";
import { Story as SchemaStory } from "@/shared/schema";

interface Story {
  id: string;
  title: string;
  transcript: string;
  audioUrl?: string;
  photoUrl?: string;
  photos?: Array<{
    id: string;
    url: string;
    isHero?: boolean;
  }>;
  storyYear?: number | null;
  createdAt: string;
  durationSeconds?: number;
  includeInBook: boolean;
  includeInTimeline: boolean;
  isFavorite: boolean;
  metadata?: {
    lessonsLearned?: string;
  };
}

type ViewMode =
  | "all"
  | "timeline"
  | "book"
  | "private"
  | "favorites"
  | "undated";
type SortBy =
  | "year-newest"
  | "year-oldest"
  | "added-newest"
  | "added-oldest"
  | "title"
  | "duration";

// Audio Manager for single playback
class AudioManager {
  private static instance: AudioManager;
  private currentAudio: HTMLAudioElement | null = null;
  private currentId: string | null = null;
  private listeners: Map<string, (playing: boolean) => void> = new Map();

  static getInstance() {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  register(id: string, callback: (playing: boolean) => void) {
    this.listeners.set(id, callback);
  }

  unregister(id: string) {
    if (this.currentId === id && this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
      this.currentId = null;
    }
    this.listeners.delete(id);
  }

  async play(id: string, audioUrl: string): Promise<void> {
    if (this.currentAudio && this.currentId !== id) {
      this.currentAudio.pause();
      this.notifyListeners(this.currentId!, false);
    }

    if (this.currentId === id && this.currentAudio) {
      if (this.currentAudio.paused) {
        await this.currentAudio.play();
        this.notifyListeners(id, true);
      } else {
        this.currentAudio.pause();
        this.notifyListeners(id, false);
      }
    } else {
      this.currentAudio = new Audio(audioUrl);
      this.currentId = id;

      this.currentAudio.addEventListener("ended", () => {
        this.notifyListeners(id, false);
        this.currentAudio = null;
        this.currentId = null;
      });

      await this.currentAudio.play();
      this.notifyListeners(id, true);
    }
  }

  private notifyListeners(id: string, playing: boolean) {
    const callback = this.listeners.get(id);
    if (callback) callback(playing);
  }
}

export default function MemoryBoxPage() {
  const router = useRouter();
  const { user, session } = useAuth();
  const modeSelection = useModeSelection();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterMode, setFilterMode] = useState<ViewMode>("all");
  const [sortBy, setSortBy] = useState<SortBy>("added-newest");
  const [selectedStories, setSelectedStories] = useState<Set<string>>(
    new Set(),
  );

  const {
    data: stories = [],
    isLoading,
    refetch,
  } = useQuery<Story[]>({
    queryKey: ["/api/stories", session?.access_token],
    queryFn: async () => {
      const token = session?.access_token;
      if (!token) throw new Error("No authentication token");

      const response = await fetch("/api/stories", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch stories");
      const data = await response.json();
      return data.stories || [];
    },
    enabled: !!session?.access_token && !!user,
  });

  const updateStory = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Story>;
    }) => {
      const response = await fetch(`/api/stories/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update story");
      }
      return response.json();
    },
    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["/api/stories", session?.access_token],
      });

      // Snapshot the previous value
      const previousStories = queryClient.getQueryData<Story[]>([
        "/api/stories",
        session?.access_token,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData<Story[]>(
        ["/api/stories", session?.access_token],
        (old) => {
          if (!old) return old;
          return old.map((story) =>
            story.id === id ? { ...story, ...updates } : story,
          );
        },
      );

      // Return context with the snapshotted value
      return { previousStories };
    },
    onSuccess: (data) => {
      console.log("Update successful, response:", data);
      queryClient.invalidateQueries({
        queryKey: ["/api/stories", session?.access_token],
      });
      toast({ title: "Memory updated successfully" });
    },
    onError: (error: Error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousStories) {
        queryClient.setQueryData(
          ["/api/stories", session?.access_token],
          context.previousStories,
        );
      }
      toast({
        title: "Failed to update memory",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteStory = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/stories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!response.ok) throw new Error("Failed to delete story");
    },
    onSuccess: () => {
      refetch();
      toast({ title: "Memory deleted successfully" });
    },
  });

  const processedStories = useMemo(() => {
    let filtered = [...stories];

    switch (filterMode) {
      case "timeline":
        filtered = filtered.filter((s) => s.includeInTimeline);
        break;
      case "book":
        filtered = filtered.filter((s) => s.includeInBook);
        break;
      case "private":
        filtered = filtered.filter(
          (s) => !s.includeInTimeline && !s.includeInBook,
        );
        break;
      case "favorites":
        filtered = filtered.filter((s) => s.isFavorite);
        break;
      case "undated":
        filtered = filtered.filter((s) => !s.storyYear);
        break;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (story) =>
          story.title.toLowerCase().includes(query) ||
          story.transcript?.toLowerCase().includes(query),
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "year-newest":
          return (b.storyYear || 0) - (a.storyYear || 0);
        case "year-oldest":
          return (a.storyYear || 0) - (b.storyYear || 0);
        case "added-newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "added-oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "title":
          return a.title.localeCompare(b.title);
        case "duration":
          return (b.durationSeconds || 0) - (a.durationSeconds || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [stories, filterMode, searchQuery, sortBy]);

  const stats = useMemo(() => {
    const totalDuration = stories.reduce(
      (sum, s) => sum + (s.durationSeconds || 0),
      0,
    );
    const timelineCount = stories.filter((s) => s.includeInTimeline).length;
    const bookCount = stories.filter((s) => s.includeInBook).length;
    const privateCount = stories.filter(
      (s) => !s.includeInTimeline && !s.includeInBook,
    ).length;
    const favoritesCount = stories.filter((s) => s.isFavorite).length;
    const undatedCount = stories.filter((s) => !s.storyYear).length;

    return {
      total: stories.length,
      timeline: timelineCount,
      book: bookCount,
      private: privateCount,
      favorites: favoritesCount,
      undated: undatedCount,
      duration: totalDuration,
      words: stories.reduce(
        (sum, s) => sum + (s.transcript?.split(" ").length || 0),
        0,
      ),
    };
  }, [stories]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const handleToggleTimeline = (id: string) => {
    const story = stories.find((s) => s.id === id);
    if (story && story.storyYear) {
      console.log(
        "Toggling timeline for story:",
        id,
        "Current value:",
        story.includeInTimeline,
        "New value:",
        !story.includeInTimeline,
      );
      updateStory.mutate({
        id,
        updates: { includeInTimeline: !story.includeInTimeline },
      });
    } else {
      console.log(
        "Cannot toggle timeline - story not found or missing year:",
        story,
      );
    }
  };

  const handleToggleBook = (id: string) => {
    const story = stories.find((s) => s.id === id);
    if (story) {
      console.log(
        "Toggling book for story:",
        id,
        "Current value:",
        story.includeInBook,
        "New value:",
        !story.includeInBook,
      );
      updateStory.mutate({
        id,
        updates: { includeInBook: !story.includeInBook },
      });
    } else {
      console.log("Cannot toggle book - story not found:", id);
    }
  };

  const handleToggleFavorite = (id: string) => {
    const story = stories.find((s) => s.id === id);
    if (story) {
      updateStory.mutate({ id, updates: { isFavorite: !story.isFavorite } });
    }
  };

  const handleSelectStory = (id: string) => {
    const newSelection = new Set(selectedStories);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedStories(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedStories.size === processedStories.length) {
      setSelectedStories(new Set());
    } else {
      setSelectedStories(new Set(processedStories.map((s) => s.id)));
    }
  };

  const handleBulkAction = (
    action: "timeline" | "book" | "private" | "delete",
  ) => {
    const selectedIds = Array.from(selectedStories);

    if (action === "delete") {
      if (
        confirm(`Delete ${selectedIds.length} memories? This cannot be undone.`)
      ) {
        selectedIds.forEach((id) => deleteStory.mutate(id));
        setSelectedStories(new Set());
      }
    } else {
      const updates: Partial<Story> = {};
      if (action === "timeline") {
        updates.includeInTimeline = true;
        updates.includeInBook = false;
      } else if (action === "book") {
        updates.includeInBook = true;
        updates.includeInTimeline = false;
      } else if (action === "private") {
        updates.includeInTimeline = false;
        updates.includeInBook = false;
      }

      selectedIds.forEach((id) => updateStory.mutate({ id, updates }));
      setSelectedStories(new Set());
    }
  };

  const toolbarStats = [
    { label: "Memories", value: stats.total },
    { label: "In Timeline", value: stats.timeline },
    { label: "In Book", value: stats.book },
    { label: "Private", value: stats.private },
  ];

  const formatDurationShort = (seconds?: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const calculateAge = (storyYear?: number | null) => {
    if (!storyYear || !user?.birthYear) return undefined;
    const age = storyYear - user.birthYear;
    if (age < 0) return undefined;
    return age.toString();
  };

  return (
    <div
      className={`min-h-screen pb-20 md:pb-0 ${viewMode === "list" ? "hw-list" : ""}`}
      style={{ background: "var(--color-page)" }}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Box className="w-8 h-8" style={{ color: "#1f0f08" }} />
            <h1 className="text-2xl font-bold">Memory Box</h1>
          </div>
        </div>
      </header>

      {/* Toolbar with Stats and Controls */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <MemoryToolbar
            stats={toolbarStats}
            view={viewMode}
            setView={setViewMode}
            filter={searchQuery}
            setFilter={setSearchQuery}
            sort={sortBy}
            setSort={(s) => setSortBy(s as SortBy)}
            filterMode={filterMode}
            setFilterMode={(mode) => setFilterMode(mode as ViewMode)}
          />
        </div>
      </section>

      {/* Stories Content */}
      <section className="max-w-7xl mx-auto px-6 py-6">
        {isLoading ? (
          <div className="hw-grid-mem">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="hw-skel" />
            ))}
          </div>
        ) : processedStories.length === 0 ? (
          <Card className="text-center py-16">
            <Box className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <h3 className="text-2xl font-semibold mb-2">
              {filterMode === "all" && !searchQuery
                ? "Your Memory Box is empty"
                : "No memories found"}
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              {filterMode === "all" && !searchQuery
                ? "Start adding memories to build your collection"
                : "Try adjusting your filters or search terms"}
            </p>
            {filterMode === "all" && !searchQuery && (
              <Button
                onClick={modeSelection.openModal}
                className="bg-heritage-coral hover:bg-heritage-coral/90 text-white text-lg px-6 py-3"
              >
                Add Your First Memory
              </Button>
            )}
          </Card>
        ) : viewMode === "list" ? (
          <MemoryList
            stories={processedStories.map((story) => {
              const heroPhoto =
                story.photos?.find((p) => p.isHero) || story.photos?.[0];
              const photoUrl =
                heroPhoto?.url || story.photoUrl || "/images/placeholder.jpg";

              return {
                id: story.id,
                title: story.title,
                content: story.transcript || "",
                year_of_event: story.storyYear || null,
                user_birth_year: user?.birthYear || null,
                audio_duration: story.durationSeconds || null,
                audio_url: story.audioUrl || null,
                cover_photo_url: photoUrl,
                show_in_timeline: story.includeInTimeline,
                include_in_book: story.includeInBook,
                is_favorite: story.isFavorite,
              } as SchemaStory;
            })}
            onPlay={(id) => {
              const story = processedStories.find((s) => s.id === id);
              if (story?.audioUrl) {
                AudioManager.getInstance().play(id, story.audioUrl);
              }
            }}
            onOpen={(id) => router.push(`/review/book-style?edit=${id}`)}
            onToggleFavorite={handleToggleFavorite}
            onDelete={(id) => {
              if (confirm("Delete this memory? This cannot be undone.")) {
                deleteStory.mutate(id);
              }
            }}
            density="comfortable"
          />
        ) : (
          <div className="hw-grid-mem">
            {processedStories.map((story) => {
              const heroPhoto =
                story.photos?.find((p) => p.isHero) || story.photos?.[0];
              const photoUrl =
                heroPhoto?.url || story.photoUrl || "/images/placeholder.jpg";
              const isPrivate =
                !story.includeInTimeline && !story.includeInBook;

              return (
                <MemoryCard
                  key={story.id}
                  imageUrl={photoUrl}
                  title={story.title}
                  year={story.storyYear || "—"}
                  age={calculateAge(story.storyYear)}
                  duration={formatDurationShort(story.durationSeconds)}
                  isPrivate={isPrivate}
                  isFavorite={story.isFavorite}
                  inTimeline={story.includeInTimeline}
                  inBook={story.includeInBook}
                  onPlay={() => {
                    if (story.audioUrl) {
                      AudioManager.getInstance().play(story.id, story.audioUrl);
                    }
                  }}
                  onEdit={() =>
                    router.push(`/review/book-style?edit=${story.id}`)
                  }
                  onToggleFavorite={() => handleToggleFavorite(story.id)}
                  onDelete={() => {
                    if (confirm("Delete this memory? This cannot be undone.")) {
                      deleteStory.mutate(story.id);
                    }
                  }}
                  onToggleTimeline={() => handleToggleTimeline(story.id)}
                  onToggleBook={() => handleToggleBook(story.id)}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Export Section */}
      <section className="max-w-7xl mx-auto px-6 pb-8">
        <Card className="p-6 bg-gradient-to-r from-gray-50 to-gray-100">
          <h3 className="text-xl font-bold mb-4">Export Your Memories</h3>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <Download className="w-6 h-6 mb-2" />
              <span>Download PDF</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Printer className="w-6 h-6 mb-2" />
              <span>Print Stories</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Archive className="w-6 h-6 mb-2" />
              <span>Backup All</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Volume2 className="w-6 h-6 mb-2" />
              <span>Audio Collection</span>
            </Button>
          </div>
        </Card>
      </section>

      {/* Mode Selection Modal */}
      <ModeSelectionModal
        isOpen={modeSelection.isOpen}
        onClose={modeSelection.closeModal}
        onSelectQuickStory={modeSelection.openQuickRecorder}
      />

      {/* Quick Story Recorder */}
      <QuickStoryRecorder
        isOpen={modeSelection.quickRecorderOpen}
        onClose={modeSelection.closeQuickRecorder}
      />
    </div>
  );
}
