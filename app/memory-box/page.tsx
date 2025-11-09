"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useModeSelection } from "@/hooks/use-mode-selection";
import { useAccountContext } from "@/hooks/use-account-context";
import { ModeSelectionModal } from "@/components/recording/ModeSelectionModal";
import { QuickStoryRecorder } from "@/components/recording/QuickStoryRecorder";
import { LeftSidebar } from "@/components/LeftSidebar";
import { useMediaQuery } from "@/hooks/use-media-query";
import { MemoryOverlay } from "@/components/MemoryOverlay";
import { Story as SupabaseStory } from "@/lib/supabase";
import { DesktopPageHeader, MobilePageHeader } from "@/components/PageHeader";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { MemoryBoxTabs } from "@/components/memory-box/MemoryBoxTabs";
import { QuickStatsBar } from "@/components/memory-box/QuickStatsBar";
import { StoryFilters, type StoryFilterType } from "@/components/memory-box/StoryFilters";
import { StoryCard } from "@/components/memory-box/StoryCard";
import { TreasureGrid } from "@/components/memory-box/TreasureGrid";
import { AddTreasureModal } from "@/components/memory-box/AddTreasureModal";
import { EditMemoryModal } from "@/components/memory-box/EditMemoryModal";

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

interface Treasure {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: "photos" | "documents" | "heirlooms" | "keepsakes" | "recipes" | "memorabilia";
  year?: number;
  // NEW: Dual WebP URLs
  masterUrl?: string;
  displayUrl?: string;
  transform?: { zoom: number; position: { x: number; y: number } };
  // DEPRECATED (backward compatibility):
  imageUrl: string;
  thumbnailUrl?: string;
  isFavorite: boolean;
  linkedStoryId?: string;
  createdAt: string;
  updatedAt: string;
}

type TabType = "stories" | "treasures";

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

export default function MemoryBoxV2Page() {
  const router = useRouter();
  const { user, session } = useAuth();
  const modeSelection = useModeSelection();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const [activeTab, setActiveTab] = useState<TabType>("stories");
  const [storyFilter, setStoryFilter] = useState<StoryFilterType>("all");
  const [selectedDecade, setSelectedDecade] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [addTreasureModalOpen, setAddTreasureModalOpen] = useState(false);
  const [treasureToDelete, setTreasureToDelete] = useState<string | null>(null);
  const [storyToEdit, setStoryToEdit] = useState<Story | null>(null);

  // Make AudioManager globally accessible
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).AudioManager = AudioManager;
    }
  }, []);

  // Get active storyteller context for family sharing
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/stories", storytellerId, session?.access_token],
      });
      toast({ title: "Memory updated successfully" });
    },
    onError: (error: Error) => {
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
      queryClient.invalidateQueries({
        queryKey: ["/api/stories", storytellerId, session?.access_token],
      });
      toast({ title: "Memory deleted successfully" });
    },
  });

  // Fetch treasures
  const {
    data: treasures = [],
    isLoading: treasuresLoading,
  } = useQuery<Treasure[]>({
    queryKey: ["/api/treasures", storytellerId, session?.access_token],
    queryFn: async () => {
      const token = session?.access_token;
      if (!token) throw new Error("No authentication token");

      const url = storytellerId
        ? `/api/treasures?storyteller_id=${storytellerId}`
        : "/api/treasures";

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch treasures");
      const data = await response.json();
      return data.treasures || [];
    },
    enabled: !!session?.access_token && !!user && !!storytellerId,
  });

  // Treasure mutations
  const toggleTreasureFavorite = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const response = await fetch(`/api/treasures/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isFavorite: !isFavorite }),
      });
      if (!response.ok) throw new Error("Failed to update treasure");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/treasures", storytellerId, session?.access_token],
      });
    },
  });

  const deleteTreasure = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/treasures/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!response.ok) throw new Error("Failed to delete treasure");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/treasures", storytellerId, session?.access_token],
      });
      toast({ title: "Treasure deleted successfully" });
    },
  });

  const handleSaveTreasure = async (treasureData: {
    title: string;
    description?: string;
    category: string;
    year?: number;
    imageFile: File;
    transform?: { zoom: number; position: { x: number; y: number } };
  }) => {
    const formData = new FormData();
    formData.append("image", treasureData.imageFile);
    formData.append("title", treasureData.title);
    formData.append("category", treasureData.category);
    if (treasureData.description) {
      formData.append("description", treasureData.description);
    }
    if (treasureData.year) {
      formData.append("year", treasureData.year.toString());
    }
    if (treasureData.transform) {
      formData.append("transform", JSON.stringify(treasureData.transform));
    }

    const response = await fetch("/api/treasures", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: formData,
    });

    if (!response.ok) throw new Error("Failed to create treasure");

    queryClient.invalidateQueries({
      queryKey: ["/api/treasures", storytellerId, session?.access_token],
    });
    toast({ title: "Treasure added successfully!" });
  };

  // Calculate decades from stories
  const availableDecades = useMemo(() => {
    const decades = new Set<string>();
    stories.forEach((story) => {
      if (story.storyYear) {
        const decade = Math.floor(story.storyYear / 10) * 10;
        decades.add(`${decade}s`);
      }
    });
    return Array.from(decades).sort();
  }, [stories]);

  // Process stories based on filters
  const processedStories = useMemo(() => {
    let filtered = [...stories];

    // Apply story filter
    switch (storyFilter) {
      case "favorites":
        filtered = filtered.filter((s) => s.isFavorite);
        break;
      case "decades":
        if (selectedDecade) {
          const decadeStart = parseInt(selectedDecade);
          filtered = filtered.filter(
            (s) => s.storyYear && s.storyYear >= decadeStart && s.storyYear < decadeStart + 10
          );
        }
        break;
      case "timeless":
        filtered = filtered.filter((s) => !s.storyYear);
        break;
      case "shared":
        filtered = filtered.filter((s) => s.includeInTimeline || s.includeInBook);
        break;
      case "private":
        filtered = filtered.filter((s) => !s.includeInTimeline && !s.includeInBook);
        break;
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (story) =>
          story.title.toLowerCase().includes(query) ||
          story.transcription?.toLowerCase().includes(query)
      );
    }

    // Sort by date added (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return filtered;
  }, [stories, storyFilter, selectedDecade, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalDuration = stories.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
    const totalHours = totalDuration / 3600;

    return {
      all: stories.length,
      favorites: stories.filter((s) => s.isFavorite).length,
      decades: stories.filter((s) => s.storyYear).length,
      timeless: stories.filter((s) => !s.storyYear).length,
      shared: stories.filter((s) => s.includeInTimeline || s.includeInBook).length,
      private: stories.filter((s) => !s.includeInTimeline && !s.includeInBook).length,
      totalHours,
      treasuresCount: treasures.length,
    };
  }, [stories, treasures]);

  const calculateAge = (storyYear?: number | null) => {
    if (!storyYear || !user?.birthYear) return undefined;
    const age = storyYear - user.birthYear;
    if (age < 0) return undefined;
    return age.toString();
  };

  const getPreviewText = (transcription: string) => {
    const words = transcription.split(" ");
    return words.slice(0, 50).join(" ") + (words.length > 50 ? "..." : "");
  };

  const handleOpenOverlay = (story: Story) => {
    setSelectedStory(story);
    setOverlayOpen(true);
  };

  const handleCloseOverlay = () => {
    setOverlayOpen(false);
    setSelectedStory(null);
  };

  const handleNavigateStory = (storyId: string) => {
    const story = processedStories.find((s) => s.id === storyId);
    if (story) {
      setSelectedStory(story);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFF8F3" }}>
      {/* Desktop Header */}
      <DesktopPageHeader
        icon={Box}
        title="Memory Box"
        subtitle="Your digital hope chest • Organize stories and treasures your way"
        showAccountSwitcher={true}
      />

      {/* Mobile Header */}
      <MobilePageHeader icon={Box} title="Memory Box" subtitle="Organize your memories" />

      {/* Content Area with Sidebar */}
      <div className="flex">
        {/* Left Sidebar */}
        {isDesktop && <LeftSidebar />}

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0">
          <section className="px-3 pt-6" style={{ maxWidth: "1400px", marginLeft: 0, marginRight: "auto" }}>
            {/* Quick Stats Bar */}
            <QuickStatsBar
              storiesCount={stats.all}
              totalHours={stats.totalHours}
              treasuresCount={stats.treasuresCount}
            />

            {/* Tab Selector */}
            <MemoryBoxTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              storiesCount={stats.all}
              treasuresCount={stats.treasuresCount}
            />

            {/* Stories Tab */}
            {activeTab === "stories" && (
              <>
                {/* Search Box */}
                <div className="mb-6">
                  <input
                    type="search"
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl focus:border-heritage-brown focus:ring-2 focus:ring-heritage-brown/20 outline-none"
                    placeholder="Search by name, person, or place..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ minHeight: "56px" }}
                  />
                </div>

                {/* Story Filters */}
                <StoryFilters
                  activeFilter={storyFilter}
                  onFilterChange={setStoryFilter}
                  counts={stats}
                  selectedDecade={selectedDecade}
                  availableDecades={availableDecades}
                  onDecadeChange={setSelectedDecade}
                />

                {/* Stories Grid */}
                <div className="mt-6">
                  {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-gray-200 animate-pulse rounded-xl" style={{ height: "300px" }} />
                      ))}
                    </div>
                  ) : processedStories.length === 0 ? (
                    <Card className="text-center py-16">
                      <Box className="w-20 h-20 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-2xl font-semibold mb-2">
                        {storyFilter === "all" && !searchQuery ? "Your Memory Box is empty" : "No memories found"}
                      </h3>
                      <p className="text-lg text-gray-600 mb-6">
                        {storyFilter === "all" && !searchQuery
                          ? "Start adding memories to build your collection"
                          : "Try adjusting your filters or search terms"}
                      </p>
                      {storyFilter === "all" && !searchQuery && (
                        <Button
                          onClick={() => router.push('/recording')}
                          className="bg-heritage-coral hover:bg-heritage-coral/90 text-white text-lg px-6 py-3"
                        >
                          Add Your First Memory
                        </Button>
                      )}
                    </Card>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {processedStories.map((story) => {
                        const heroPhoto = story.photos?.find((p) => p.isHero) || story.photos?.[0];
                        const imageUrl = heroPhoto?.url || story.photoUrl || "/images/placeholder.jpg";
                        const photoTransform = heroPhoto?.transform;
                        const isPrivate = !story.includeInTimeline && !story.includeInBook;

                        return (
                          <StoryCard
                            key={story.id}
                            id={story.id}
                            title={story.title}
                            preview=""
                            imageUrl={imageUrl}
                            photoTransform={photoTransform}
                            year={story.storyYear}
                            age={calculateAge(story.storyYear)}
                            durationSeconds={story.durationSeconds}
                            isFavorite={story.isFavorite}
                            inTimeline={story.includeInTimeline}
                            inBook={story.includeInBook}
                            isPrivate={isPrivate}
                            onView={() => {
                              setSelectedStory(story);
                              setOverlayOpen(true);
                            }}
                            onPlay={() => {
                              if (story.audioUrl) {
                                AudioManager.getInstance().play(story.id, story.audioUrl);
                              }
                            }}
                            onEdit={() => setStoryToEdit(story)}
                            onDelete={() => {
                              setStoryToDelete(story.id);
                              setShowDeleteConfirm(true);
                            }}
                            onToggleFavorite={() =>
                              updateStory.mutate({ id: story.id, updates: { isFavorite: !story.isFavorite } })
                            }
                            onToggleTimeline={() =>
                              updateStory.mutate({ id: story.id, updates: { includeInTimeline: !story.includeInTimeline } })
                            }
                            onToggleBook={() =>
                              updateStory.mutate({ id: story.id, updates: { includeInBook: !story.includeInBook } })
                            }
                            onDuplicate={() => {
                              toast({
                                title: "Duplicate feature coming soon",
                                description: "Memory duplication will be available in a future update.",
                              });
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Treasures Tab */}
            {activeTab === "treasures" && (
              <div className="mt-6">
                <TreasureGrid
                  treasures={treasures}
                  onAddTreasure={() => setAddTreasureModalOpen(true)}
                  onToggleFavorite={(id) => {
                    const treasure = treasures.find((t) => t.id === id);
                    if (treasure) {
                      toggleTreasureFavorite.mutate({ id, isFavorite: treasure.isFavorite });
                    }
                  }}
                  onLinkToStory={(id) => {
                    toast({
                      title: "Coming Soon",
                      description: "Link to Story feature will be available in a future update.",
                    });
                  }}
                  onCreateStory={(id) => {
                    toast({
                      title: "Coming Soon",
                      description: "Create Story About This feature will be available in a future update.",
                    });
                  }}
                  onEdit={(id) => {
                    toast({
                      title: "Coming Soon",
                      description: "Edit treasure details will be available in a future update.",
                    });
                  }}
                  onDownload={(id) => {
                    const treasure = treasures.find((t) => t.id === id);
                    if (treasure?.imageUrl) {
                      window.open(treasure.imageUrl, "_blank");
                    }
                  }}
                  onDelete={(id) => {
                    setTreasureToDelete(id);
                  }}
                />
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Mode Selection Modal */}
      <ModeSelectionModal
        isOpen={modeSelection.isOpen}
        onClose={modeSelection.closeModal}
        onSelectQuickStory={modeSelection.openQuickRecorder}
      />

      {/* Quick Story Recorder */}
      <QuickStoryRecorder isOpen={modeSelection.quickRecorderOpen} onClose={modeSelection.closeQuickRecorder} />

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
          stories={processedStories.map((s) => ({
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Memory?"
        message="Are you sure you want to delete this memory? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Keep Memory"
        onConfirm={() => {
          if (storyToDelete) {
            deleteStory.mutate(storyToDelete);
          }
          setShowDeleteConfirm(false);
          setStoryToDelete(null);
        }}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setStoryToDelete(null);
        }}
        variant="danger"
      />

      {/* Add Treasure Modal */}
      <AddTreasureModal
        isOpen={addTreasureModalOpen}
        onClose={() => setAddTreasureModalOpen(false)}
        onSave={handleSaveTreasure}
      />

      {/* Delete Treasure Confirmation */}
      <ConfirmModal
        isOpen={!!treasureToDelete}
        title="Delete Treasure?"
        message="Are you sure you want to delete this treasure? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Keep Treasure"
        onConfirm={() => {
          if (treasureToDelete) {
            deleteTreasure.mutate(treasureToDelete);
          }
          setTreasureToDelete(null);
        }}
        onCancel={() => {
          setTreasureToDelete(null);
        }}
        variant="danger"
      />

      {/* Edit Memory Modal */}
      {storyToEdit && (
        <EditMemoryModal
          isOpen={!!storyToEdit}
          onClose={() => setStoryToEdit(null)}
          story={{
            id: storyToEdit.id,
            title: storyToEdit.title,
            storyYear: storyToEdit.storyYear,
            transcription: storyToEdit.transcription,
            photoUrl: storyToEdit.photoUrl,
            photoTransform: storyToEdit.photos?.find(p => p.isHero)?.transform,
            metadata: storyToEdit.metadata,
          }}
          onSave={async (updates) => {
            await updateStory.mutateAsync({
              id: updates.id,
              updates: {
                title: updates.title,
                storyYear: updates.storyYear,
                transcription: updates.transcription,
                metadata: updates.metadata,
                photos: updates.photoTransform && storyToEdit.photos
                  ? storyToEdit.photos.map(p =>
                      p.isHero
                        ? { ...p, transform: updates.photoTransform }
                        : p
                    )
                  : storyToEdit.photos,
              },
            });
            setStoryToEdit(null);
            toast({
              title: "Changes saved",
              description: "Your memory has been updated successfully.",
            });
          }}
        />
      )}
    </div>
  );
}
