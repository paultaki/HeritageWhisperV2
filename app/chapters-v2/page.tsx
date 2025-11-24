"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Plus } from "lucide-react";
import { toast } from "sonner";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    DragEndEvent,
    DragStartEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { DesktopPageHeader, MobilePageHeader } from "@/components/PageHeader";

// Placeholder components - will be implemented shortly
import { ChapterList } from "@/components/chapters-v2/ChapterList";
import { StoryList } from "@/components/chapters-v2/StoryList";
import { ChapterCard } from "@/components/chapters-v2/ChapterCard";
import { StoryCard } from "@/components/chapters-v2/StoryCard";

// Types
export interface Story {
    id: string;
    title: string;
    storyYear?: number;
    chapterId?: string;
    chapterOrderIndex?: number;
}

export interface Chapter {
    id: string;
    title: string;
    orderIndex: number;
    stories: Story[];
}

export default function ChaptersPageV2() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [activeDragItem, setActiveDragItem] = useState<any>(null);

    const { data: chapters = [], isLoading } = useQuery<Chapter[]>({
        queryKey: ["chapters"],
        queryFn: async () => {
            const res = await apiRequest("GET", "/api/chapters");
            const data = await res.json();

            const fetchedChapters = data.chapters || [];
            const orphanedStories = data.orphanedStories || [];

            if (orphanedStories.length > 0) {
                return [
                    {
                        id: "uncategorized",
                        title: "Uncategorized Stories",
                        orderIndex: -1,
                        stories: orphanedStories
                    },
                    ...fetchedChapters
                ];
            }

            return fetchedChapters;
        },
        enabled: !!user,
    });

    useEffect(() => {
        if (chapters.length > 0 && !activeChapterId) {
            setActiveChapterId(chapters[0].id);
        }
    }, [chapters, activeChapterId]);

    const organizeMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/chapters/organize");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["chapters"] });
            toast.success("Chapters organized successfully!");
        },
        onError: () => {
            toast.error("Failed to organize chapters.");
        },
    });

    const createChapterMutation = useMutation({
        mutationFn: async () => {
            const res = await apiRequest("POST", "/api/chapters", { title: "New Chapter" });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["chapters"] });
            toast.success("New chapter created");
        },
    });

    // ... (Other mutations: rename, delete, moveStory, reorderChapters - will implement in components or pass down)
    // For now, let's keep the mutations here to pass them down, or move to a custom hook later.

    const renameChapterMutation = useMutation({
        mutationFn: async ({ id, title }: { id: string; title: string }) => {
            await apiRequest("PUT", `/api/chapters/${id}`, { title });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["chapters"] });
        },
    });

    const deleteChapterMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiRequest("DELETE", `/api/chapters/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["chapters"] });
            toast.success("Chapter deleted");
            setActiveChapterId(null);
        },
        onError: () => {
            toast.error("Failed to delete chapter");
        },
    });

    const reorderChaptersMutation = useMutation({
        mutationFn: async (updates: any[]) => {
            await apiRequest("POST", "/api/chapters/reorder", { updates });
        },
        onMutate: async (updates) => {
            await queryClient.cancelQueries({ queryKey: ["chapters"] });
            const previousChapters = queryClient.getQueryData<Chapter[]>(["chapters"]);

            queryClient.setQueryData<Chapter[]>(["chapters"], (old) => {
                if (!old) return [];
                const newChapters = [...old];
                updates.forEach((update: any) => {
                    const chapter = newChapters.find(c => c.id === update.id);
                    if (chapter) {
                        chapter.orderIndex = update.orderIndex;
                    }
                });
                return newChapters.sort((a, b) => a.orderIndex - b.orderIndex);
            });

            return { previousChapters };
        },
        onError: (err, newTodo, context) => {
            queryClient.setQueryData(["chapters"], context?.previousChapters);
            toast.error("Failed to reorder chapters");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["chapters"] });
        },
    });

    const moveStoryMutation = useMutation({
        mutationFn: async (updates: any[]) => {
            await apiRequest("POST", "/api/stories/move", { updates });
        },
        onMutate: async (updates) => {
            await queryClient.cancelQueries({ queryKey: ["chapters"] });
            const previousChapters = queryClient.getQueryData<Chapter[]>(["chapters"]);

            queryClient.setQueryData<Chapter[]>(["chapters"], (old) => {
                if (!old) return [];
                const newChapters = JSON.parse(JSON.stringify(old)); // Deep copy

                updates.forEach((update: any) => {
                    // Find source chapter and remove story
                    let story: any;
                    newChapters.forEach((c: any) => {
                        const sIndex = c.stories.findIndex((s: any) => s.id === update.storyId);
                        if (sIndex !== -1) {
                            story = c.stories.splice(sIndex, 1)[0];
                        }
                    });

                    // If story found, add to target chapter
                    if (story) {
                        const targetChapter = newChapters.find((c: any) => c.id === update.chapterId);
                        if (targetChapter) {
                            story.chapterId = update.chapterId;
                            story.chapterOrderIndex = update.orderIndex;

                            // Insert at specific index or append
                            if (update.orderIndex >= targetChapter.stories.length) {
                                targetChapter.stories.push(story);
                            } else {
                                targetChapter.stories.splice(update.orderIndex, 0, story);
                            }
                        }
                    }
                });

                return newChapters;
            });

            return { previousChapters };
        },
        onError: (err, newTodo, context) => {
            queryClient.setQueryData(["chapters"], context?.previousChapters);
            toast.error("Failed to move story");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["chapters"] });
        },
    });


    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragId(event.active.id as string);
        setActiveDragItem(event.active.data.current);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragId(null);
        setActiveDragItem(null);

        if (!over) return;

        // Handle Chapter Reorder
        if (active.data.current?.type === "chapter" && over.data.current?.type === "chapter") {
            if (active.id !== over.id) {
                const oldIndex = chapters.findIndex(c => c.id === active.id);
                const newIndex = chapters.findIndex(c => c.id === over.id);

                const newChapters = arrayMove(chapters, oldIndex, newIndex);
                const updates = newChapters.map((c, index) => ({
                    id: c.id,
                    orderIndex: index
                }));

                reorderChaptersMutation.mutate(updates);
            }
            return;
        }

        // Handle Story Drop
        if (active.data.current?.type === "story") {
            const storyId = active.id as string;
            const activeStory = active.data.current.story as Story;

            // Dropped on a chapter in sidebar
            if (over.data.current?.type === "chapter") {
                const targetChapterId = over.id as string;
                if (activeStory.chapterId !== targetChapterId) {
                    moveStoryMutation.mutate([{
                        storyId,
                        chapterId: targetChapterId,
                        orderIndex: 9999 // Append to end
                    }]);
                    toast.success("Moved story to chapter");
                }
            }
            // Dropped on another story (reorder)
            else if (over.data.current?.type === "story") {
                const targetStoryId = over.id as string;
                const targetStory = over.data.current.story as Story;

                if (storyId !== targetStoryId && activeStory.chapterId === targetStory.chapterId) {
                    // Reordering within same chapter
                    const chapter = chapters.find(c => c.id === activeStory.chapterId);
                    if (chapter) {
                        const oldIndex = chapter.stories.findIndex(s => s.id === storyId);
                        const newIndex = chapter.stories.findIndex(s => s.id === targetStoryId);

                        const newStories = arrayMove(chapter.stories, oldIndex, newIndex);
                        const updates = newStories.map((s, index) => ({
                            storyId: s.id,
                            chapterId: s.chapterId,
                            orderIndex: index
                        }));

                        moveStoryMutation.mutate(updates);
                    }
                }
            }
        }
    };

    const activeChapter = chapters.find(c => c.id === activeChapterId);

    return (
        <div className="min-h-screen bg-[var(--hw-page-bg)] text-[var(--hw-text-primary)] font-sans pb-20">
            {/* Header */}
            <div className="fixed top-0 left-0 right-0 z-50">
                <DesktopPageHeader
                    title="Chapters"
                    subtitle="Organize your memories"
                />
                <MobilePageHeader
                    title="Chapters"
                />
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 mt-[52px] md:mt-[62px]">
                    {/* Sidebar: Chapter List */}
                    <div className="md:col-span-4 lg:col-span-3 flex flex-col gap-3">
                        <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => createChapterMutation.mutate()}
                                    disabled={createChapterMutation.isPending}
                                    className="flex-1 h-10 border-[var(--hw-border-strong)] text-[var(--hw-text-primary)] hover:bg-[var(--hw-section-bg)] text-sm"
                                >
                                    <Plus className="mr-1.5 h-4 w-4" />
                                    New Chapter
                                </Button>
                                <Button
                                    onClick={() => organizeMutation.mutate()}
                                    disabled={organizeMutation.isPending}
                                    className="flex-1 h-10 bg-[var(--hw-primary)] hover:bg-[var(--hw-primary-hover)] text-white shadow-sm text-sm"
                                >
                                    {organizeMutation.isPending ? (
                                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="mr-1.5 h-4 w-4 text-[var(--hw-accent-gold)]" />
                                    )}
                                    Auto-Arrange
                                </Button>
                            </div>
                        </div>

                        <h2 className="text-sm font-medium text-[var(--hw-text-secondary)] uppercase tracking-wide mt-2">Table of Contents</h2>
                        <ChapterList
                            chapters={chapters}
                            activeChapterId={activeChapterId}
                            onSelectChapter={setActiveChapterId}
                            onRename={(id, title) => renameChapterMutation.mutate({ id, title })}
                            onDelete={(id) => deleteChapterMutation.mutate(id)}
                        />
                    </div>

                    {/* Main Content: Stories */}
                    <div className="md:col-span-8 lg:col-span-9 min-h-[50vh]">
                        {activeChapter ? (
                            <div className="bg-[var(--hw-surface)] rounded-xl shadow-sm border border-[var(--hw-border-subtle)] p-4 md:p-6 min-h-full">
                                <div className="mb-4 md:mb-6 pb-4 border-b border-[var(--hw-border-subtle)]">
                                    <h2 className="text-2xl md:text-3xl font-serif text-[var(--hw-primary)] mb-1">{activeChapter.title}</h2>
                                    <p className="text-[var(--hw-text-muted)] text-sm">
                                        {activeChapter.stories.length} {activeChapter.stories.length === 1 ? 'story' : 'stories'}
                                    </p>
                                </div>
                                <StoryList stories={activeChapter.stories} />
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-[var(--hw-text-muted)] border-2 border-dashed border-[var(--hw-border-subtle)] rounded-xl p-8">
                                <p className="text-base">Select a chapter to view stories</p>
                            </div>
                        )}
                    </div>
                </div>

                <DragOverlay>
                    {activeDragItem?.type === "chapter" && (
                        <ChapterCard
                            chapter={activeDragItem.chapter}
                            isActive={true}
                            isOverlay={true}
                            onClick={() => { }}
                            onRename={() => { }}
                            onDelete={() => { }}
                        />
                    )}
                    {activeDragItem?.type === "story" && (
                        <StoryCard
                            story={activeDragItem.story}
                            isOverlay={true}
                        />
                    )}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
