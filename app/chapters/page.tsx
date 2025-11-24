"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, Plus, Trash2, GripVertical, BookOpen, Pencil } from "lucide-react";
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
    DragOverEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Types
interface Story {
    id: string;
    title: string;
    storyYear?: number;
    chapterId?: string;
    chapterOrderIndex?: number;
}

interface Chapter {
    id: string;
    title: string;
    orderIndex: number;
    stories: Story[];
}

// Sortable Chapter Item
function SortableChapter({
    chapter,
    isActive,
    onClick,
    onRename,
    onDelete
}: {
    chapter: Chapter;
    isActive: boolean;
    onClick: () => void;
    onRename: (id: string, newTitle: string) => void;
    onDelete: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: chapter.id, data: { type: "chapter", chapter } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(chapter.title);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onRename(chapter.id, editTitle);
        setIsEditing(false);
    };

    const isUncategorized = chapter.id === 'uncategorized';

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`mb-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 group ${isActive ? "bg-primary/10 border-primary shadow-sm" : "bg-card hover:bg-accent border-border"
                }`}
            onClick={onClick}
        >
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 w-full">
                <button
                    {...attributes}
                    {...listeners}
                    className={`cursor-grab hover:text-primary touch-none ${isUncategorized ? 'opacity-0 pointer-events-none' : ''}`}
                >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </button>

                {isEditing ? (
                    <form onSubmit={handleSave} className="w-full" onClick={e => e.stopPropagation()}>
                        <Input
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            className="h-10 text-base w-full"
                            autoFocus
                            onBlur={() => setIsEditing(false)}
                        />
                    </form>
                ) : (
                    <div
                        className="w-full overflow-hidden"
                        onDoubleClick={() => !isUncategorized && setIsEditing(true)}
                    >
                        <p className="font-semibold text-base leading-snug truncate w-full">
                            {chapter.title}
                        </p>
                    </div>
                )}

                <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap">
                    {chapter.stories.length}
                </span>

                {!isUncategorized && (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0 hover:bg-muted"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditing(true);
                            }}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm("Are you sure you want to delete this chapter? Stories will be moved to Uncategorized.")) {
                                    onDelete(chapter.id);
                                }
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Sortable Story Item
function SortableStory({ story }: { story: Story }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: story.id, data: { type: "story", story } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="mb-3 p-4 rounded-xl border bg-card grid grid-cols-[auto_1fr] items-center gap-3 hover:shadow-sm transition-all duration-200 w-full"
        >
            <button {...attributes} {...listeners} className="cursor-grab hover:text-primary touch-none">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>
            <div className="w-full overflow-hidden flex flex-col gap-1.5">
                <p className="font-medium text-base leading-snug truncate w-full">{story.title}</p>
                {story.storyYear && <p className="text-sm text-muted-foreground">{story.storyYear}</p>}
            </div>
        </div>
    );
}

export default function ChaptersPage() {
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

            // If there are orphaned stories, add a virtual "Uncategorized" chapter
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

    // Set initial active chapter
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
            // Reset active chapter if deleted
            setActiveChapterId(null);
        },
        onError: () => {
            toast.error("Failed to delete chapter");
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

                            // Re-sort stories in target chapter to ensure correct order
                            // Note: We might need to re-index all stories in the chapter to be safe, 
                            // but for optimistic UI, just placing it is usually enough if the list is sorted by index.
                            // However, since we are splicing, the array order is what matters for display.
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

                // Apply updates
                updates.forEach((update: any) => {
                    const chapter = newChapters.find(c => c.id === update.id);
                    if (chapter) {
                        chapter.orderIndex = update.orderIndex;
                    }
                });

                // Sort by new order index
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
                    // We need to calculate new indices for all stories in this chapter
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
        <div className="container mx-auto py-6 md:py-8 px-4 max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
                <div>
                    <h1 className="text-3xl font-serif text-[#2c3e50] mb-2">Organize Your Story</h1>
                    <p className="text-muted-foreground">Group your memories into chapters to create a beautiful book.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button
                        variant="outline"
                        onClick={() => createChapterMutation.mutate()}
                        disabled={createChapterMutation.isPending}
                        className="flex-1 md:flex-none"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Chapter
                    </Button>
                    <Button
                        onClick={() => organizeMutation.mutate()}
                        disabled={organizeMutation.isPending}
                        className="bg-[#d4af87] hover:bg-[#c49f77] text-white flex-1 md:flex-none"
                    >
                        {organizeMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Auto-Organize
                    </Button>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[calc(100vh-200px)] max-w-full overflow-hidden">
                    {/* Sidebar: Chapters List */}
                    <div className="md:col-span-5 flex flex-col min-h-[400px] max-h-[60vh] md:h-full w-full">
                        <div className="bg-white rounded-xl shadow-sm border p-5 flex-1 flex flex-col w-full">
                            <h2 className="font-serif text-xl font-semibold mb-5 flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-[#d4af87]" />
                                Chapters
                            </h2>

                            <div className="flex-1 overflow-y-auto pr-2 w-full">
                                <SortableContext
                                    items={chapters.map(c => c.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {chapters.map(chapter => (
                                        <SortableChapter
                                            key={chapter.id}
                                            chapter={chapter}
                                            isActive={activeChapterId === chapter.id}
                                            onClick={() => setActiveChapterId(chapter.id)}
                                            onRename={(id, title) => renameChapterMutation.mutate({ id, title })}
                                            onDelete={(id) => deleteChapterMutation.mutate(id)}
                                        />
                                    ))}
                                </SortableContext>

                                {chapters.length === 0 && !isLoading && (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        No chapters yet. Click "Auto-Organize" to start.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Content: Stories in Chapter */}
                    <div className="md:col-span-7 min-h-[500px] max-h-[70vh] md:h-full">
                        <div className="bg-white rounded-xl shadow-sm border p-5 md:p-6 h-full flex flex-col overflow-hidden">
                            {activeChapter ? (
                                <>
                                    <div className="mb-5 md:mb-6 pb-4 border-b">
                                        <h2 className="text-xl md:text-2xl font-serif font-semibold text-[#2c3e50] leading-snug">{activeChapter.title}</h2>
                                        <p className="text-muted-foreground text-sm mt-2">
                                            {activeChapter.stories.length} {activeChapter.stories.length === 1 ? 'story' : 'stories'} in this chapter
                                        </p>
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-2">
                                        <SortableContext
                                            items={activeChapter.stories.map(s => s.id)}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {activeChapter.stories.map(story => (
                                                <SortableStory key={story.id} story={story} />
                                            ))}
                                        </SortableContext>

                                        {activeChapter.stories.length === 0 && (
                                            <div className="text-center py-12 border-2 border-dashed rounded-lg bg-slate-50">
                                                <p className="text-muted-foreground">Drag stories here from other chapters</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                                    Select a chapter to view stories
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DragOverlay>
                    {activeDragItem?.type === "chapter" && (
                        <div className="p-3 rounded-lg border bg-white shadow-lg opacity-80 w-64">
                            <span className="font-medium">{activeDragItem.chapter.title}</span>
                        </div>
                    )}
                    {activeDragItem?.type === "story" && (
                        <div className="p-4 rounded-lg border bg-white shadow-lg opacity-80 w-96">
                            <div className="font-medium text-lg">{activeDragItem.story.title}</div>
                        </div>
                    )}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
