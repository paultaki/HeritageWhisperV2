import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { StoryCard } from "./StoryCard";
import { Story } from "@/app/chapters-v2/page";

interface StoryListProps {
    stories: Story[];
}

export function StoryList({ stories }: StoryListProps) {
    return (
        <div className="flex flex-col gap-3">
            <SortableContext
                items={stories.map(s => s.id)}
                strategy={verticalListSortingStrategy}
            >
                {stories.map(story => (
                    <StoryCard key={story.id} story={story} />
                ))}
            </SortableContext>

            {stories.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-[var(--hw-border-subtle)] rounded-xl bg-[var(--hw-page-bg)]/50">
                    <p className="text-[var(--hw-text-muted)]">Drag stories here from other chapters</p>
                </div>
            )}
        </div>
    );
}
