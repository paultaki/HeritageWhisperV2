"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Box } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useModeSelection } from "@/hooks/use-mode-selection";
import { useAccountContext } from "@/hooks/use-account-context";
import { ModeSelectionModal } from "@/components/recording/ModeSelectionModal";
import { QuickStoryRecorder } from "@/components/recording/QuickStoryRecorder";
import MemoryList from "@/components/memory-box/MemoryList";
import { useMediaQuery } from "@/hooks/use-media-query";
import { MemoryOverlay } from "@/components/MemoryOverlay";
import { Story as SupabaseStory } from "@/lib/supabase";
import { DesktopPageHeader, MobilePageHeader } from "@/components/PageHeader";

interface Story {
  id: string;
  title: string;
  transcription: string;
  audioUrl?: string;
  photoUrl?: string;
  photos?: Array<{
    id: string;
    url: string;
    isHero?: boolean;
    transform?: { zoom: number; position: { x: number; y: number } };
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
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [overlayOpen, setOverlayOpen] = useState(false);

  // Make AudioManager globally accessible for MemoryCard components
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).AudioManager = AudioManager;
    }
  }, []);

  // V3: Get active storyteller context for family sharing
  const { activeContext } = useAccountContext();
  const storytellerId = activeContext?.storytellerId || user?.id;

  const {
    data: stories = [],
    isLoading,
    refetch,
  } = useQuery<Story[]>({
    queryKey: ["/api/stories", storytellerId, session?.access_token],
    queryFn: async () => {
      const token = session?.access_token;
      if (!token) throw new Error("No authentication token");

      const url = storytellerId
        ? `/api/stories?storyteller_id=${storytellerId}`
        : "/api/stories";

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch stories");
      const data = await response.json();
      return data.stories || [];
    },
    enabled: !!session?.access_token && !!user && !!storytellerId,
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
        queryKey: ["/api/stories", storytellerId, session?.access_token],
      });

      // Snapshot the previous value
      const previousStories = queryClient.getQueryData<Story[]>([
        "/api/stories",
        storytellerId,
        session?.access_token,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData<Story[]>(
        ["/api/stories", storytellerId, session?.access_token],
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
      // Invalidate all story queries to refresh timeline, memory box, etc.
      queryClient.invalidateQueries({
        queryKey: ["/api/stories", storytellerId, session?.access_token],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      toast({ title: "Memory updated successfully" });
    },
    onError: (error: Error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousStories) {
        queryClient.setQueryData(
          ["/api/stories", storytellerId, session?.access_token],
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
      // Invalidate all story queries to refresh timeline, memory box, etc.
      queryClient.invalidateQueries({
        queryKey: ["/api/stories", storytellerId, session?.access_token],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      toast({ title: "Memory deleted successfully" });
    },
  });

  // Map Story to Memory format for MemoryList component
  const memories = useMemo(() => {
    return stories.map((story) => {
      const heroPhoto = story.photos?.find((p) => p.isHero) || story.photos?.[0];
      const thumbUrl = heroPhoto?.url || story.photoUrl || "/images/placeholder.jpg";
      const age = story.storyYear && user?.birthYear
        ? story.storyYear - user.birthYear
        : undefined;

      return {
        id: story.id,
        title: story.title,
        year: story.storyYear || 0,
        age: age && age >= 0 ? age : undefined,
        durationSec: story.durationSeconds,
        hasAudio: !!story.audioUrl,
        onTimeline: story.includeInTimeline,
        inBook: story.includeInBook,
        favorited: story.isFavorite,
        thumbUrl,
      };
    });
  }, [stories, user?.birthYear]);

  const handleToggleTimeline = (id: string) => {
    const story = stories.find((s) => s.id === id);
    if (story && story.storyYear) {
      updateStory.mutate({
        id,
        updates: { includeInTimeline: !story.includeInTimeline },
      });
    }
  };

  const handleToggleBook = (id: string) => {
    const story = stories.find((s) => s.id === id);
    if (story) {
      updateStory.mutate({
        id,
        updates: { includeInBook: !story.includeInBook },
      });
    }
  };

  const handleToggleFavorite = (id: string) => {
    const story = stories.find((s) => s.id === id);
    if (story) {
      updateStory.mutate({ id, updates: { isFavorite: !story.isFavorite } });
    }
  };

  const calculateAge = (storyYear?: number | null) => {
    if (!storyYear || !user?.birthYear) return undefined;
    const age = storyYear - user.birthYear;
    if (age < 0) return undefined;
    return age.toString();
  };

  const handleOpenOverlay = (story: Story) => {
    // Convert local Story type to SupabaseStory type for MemoryOverlay
    const supabaseStory: SupabaseStory = {
      id: story.id,
      title: story.title,
      transcription: story.transcription,
      audioUrl: story.audioUrl || "",
      photoUrl: story.photoUrl || undefined,
      photos: story.photos || undefined,
      storyYear: story.storyYear ?? undefined,
      createdAt: story.createdAt,
      includeInBook: story.includeInBook,
      includeInTimeline: story.includeInTimeline,
      isFavorite: story.isFavorite,
      wisdomClipText: story.metadata?.lessonsLearned || undefined,
      lifeAge: story.storyYear ? parseInt(calculateAge(story.storyYear) || "0") : undefined,
      userId: user?.id || "",
      photoTransform: undefined,
      updatedAt: undefined,
      wisdomClipAudio: undefined,
    };
    setSelectedStory(story);
    setOverlayOpen(true);
  };

  const handleCloseOverlay = () => {
    setOverlayOpen(false);
    setSelectedStory(null);
  };

  const handleNavigateStory = (storyId: string) => {
    const story = stories.find((s) => s.id === storyId);
    if (story) {
      setSelectedStory(story);
    }
  };

  // Bulk action handlers
  const handleBulkDelete = (ids: string[]) => {
    if (confirm(`Delete ${ids.length} memories? This cannot be undone.`)) {
      ids.forEach((id) => deleteStory.mutate(id));
    }
  };

  const handleBulkFavorite = (ids: string[]) => {
    ids.forEach((id) => {
      const story = stories.find((s) => s.id === id);
      if (story && !story.isFavorite) {
        updateStory.mutate({ id, updates: { isFavorite: true } });
      }
    });
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#FFF8F3" }}
    >
      {/* Desktop Header */}
      <DesktopPageHeader
        icon={Box}
        title="Memory Box"
        subtitle="Manage your memories, add or remove them from the book or timeline"
        showAccountSwitcher={true}
      />
      
      {/* Mobile Header */}
      <MobilePageHeader
        icon={Box}
        title="Memory Box"
        subtitle="Manage your memories"
      />

      {/* Content Area - Compact Memory List */}
      <div className="flex justify-center">
        <main className="w-full max-w-7xl">
          <MemoryList
            items={memories}
            onBulkDelete={handleBulkDelete}
            onBulkFavorite={handleBulkFavorite}
            onOpen={(id) => {
              const story = stories.find((s) => s.id === id);
              if (story) handleOpenOverlay(story);
            }}
            onToggleTimeline={handleToggleTimeline}
            onToggleBook={handleToggleBook}
            onListen={(id) => {
              const story = stories.find((s) => s.id === id);
              if (story?.audioUrl) {
                AudioManager.getInstance().play(id, story.audioUrl);
              }
            }}
            onEdit={(id) => {
              const story = stories.find((s) => s.id === id);
              if (story) handleOpenOverlay(story);
            }}
            onFavorite={handleToggleFavorite}
            onDelete={(id) => {
              if (confirm("Delete this memory? This cannot be undone.")) {
                deleteStory.mutate(id);
              }
            }}
          />
        </main>
      </div>

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

      {/* Memory Overlay */}
      {selectedStory && (
        <MemoryOverlay
          story={{
            id: selectedStory.id,
            title: selectedStory.title,
            transcription: selectedStory.transcription,
            audioUrl: selectedStory.audioUrl || "",
            photoUrl: selectedStory.photoUrl || undefined,
            photos: selectedStory.photos || undefined,
            storyYear: selectedStory.storyYear || undefined,
            createdAt: selectedStory.createdAt,
            includeInBook: selectedStory.includeInBook,
            includeInTimeline: selectedStory.includeInTimeline,
            isFavorite: selectedStory.isFavorite,
            wisdomClipText: selectedStory.metadata?.lessonsLearned || undefined,
            lifeAge: selectedStory.storyYear ? parseInt(calculateAge(selectedStory.storyYear) || "0") : undefined,
            userId: user?.id || "",
            photoTransform: undefined,
            updatedAt: undefined,
            wisdomClipAudio: undefined,
          }}
          stories={stories.map((s) => ({
            id: s.id,
            title: s.title,
            transcription: s.transcription,
            audioUrl: s.audioUrl || "",
            photoUrl: s.photoUrl || undefined,
            photos: s.photos || undefined,
            storyYear: s.storyYear || undefined,
            createdAt: s.createdAt,
            includeInBook: s.includeInBook,
            includeInTimeline: s.includeInTimeline,
            isFavorite: s.isFavorite,
            wisdomClipText: s.metadata?.lessonsLearned || undefined,
            lifeAge: s.storyYear ? parseInt(calculateAge(s.storyYear) || "0") : undefined,
            userId: user?.id || "",
            photoTransform: undefined,
            updatedAt: undefined,
            wisdomClipAudio: undefined,
          }))}
          isOpen={overlayOpen}
          onClose={handleCloseOverlay}
          onNavigate={handleNavigateStory}
          originPath="/memory-box"
        />
      )}

    </div>
  );
}
