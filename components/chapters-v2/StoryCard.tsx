import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Story } from "@/app/chapters-v2/page";

interface StoryCardProps {
    story: Story;
    isOverlay?: boolean;
}

export function StoryCard({ story, isOverlay = false }: StoryCardProps) {
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

    if (isOverlay) {
        return (
            <div className="bg-[var(--hw-surface)] border border-[var(--hw-primary)] shadow-lg rounded-xl p-4 flex items-center gap-3 w-full max-w-md cursor-grabbing">
                <GripVertical className="h-5 w-5 text-[var(--hw-text-muted)]" />
                <div className="flex flex-col">
                    <div className="font-medium text-lg text-[var(--hw-primary)]">{story.title}</div>
                    {story.storyYear && <div className="text-sm text-[var(--hw-text-muted)]">{story.storyYear}</div>}
                </div>
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group bg-[var(--hw-surface)] border border-[var(--hw-border-subtle)] hover:border-[var(--hw-border-strong)] hover:shadow-sm rounded-xl p-4 grid grid-cols-[auto_1fr] items-center gap-4 transition-all duration-200 w-full"
        >
            <button
                {...attributes}
                {...listeners}
                className="touch-none p-1 rounded-md hover:bg-[var(--hw-section-bg)] text-[var(--hw-text-muted)] hover:text-[var(--hw-primary)] transition-colors cursor-grab active:cursor-grabbing flex-shrink-0"
            >
                <GripVertical className="h-5 w-5" />
            </button>

            <div className="min-w-0 overflow-hidden">
                <h4 className="font-medium text-lg text-[var(--hw-text-primary)] truncate leading-tight">
                    {story.title}
                </h4>
                {story.storyYear && (
                    <p className="text-sm text-[var(--hw-text-muted)] mt-0.5 truncate">
                        {story.storyYear}
                    </p>
                )}
            </div>
        </div>
    );
}
