import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ChapterCard } from "./ChapterCard";
import { Chapter } from "@/app/chapters-v2/page";

interface ChapterListProps {
    chapters: Chapter[];
    activeChapterId: string | null;
    onSelectChapter: (id: string) => void;
    onRename: (id: string, newTitle: string) => void;
    onDelete: (id: string) => void;
}

export function ChapterList({
    chapters,
    activeChapterId,
    onSelectChapter,
    onRename,
    onDelete
}: ChapterListProps) {
    return (
        <div className="flex flex-col gap-3">
            <SortableContext
                items={chapters.map(c => c.id)}
                strategy={verticalListSortingStrategy}
            >
                {chapters.map(chapter => (
                    <ChapterCard
                        key={chapter.id}
                        chapter={chapter}
                        isActive={activeChapterId === chapter.id}
                        onClick={() => onSelectChapter(chapter.id)}
                        onRename={onRename}
                        onDelete={onDelete}
                    />
                ))}
            </SortableContext>

            {chapters.length === 0 && (
                <div className="text-center py-8 text-[var(--hw-text-muted)] text-sm border border-dashed border-[var(--hw-border-subtle)] rounded-xl">
                    No chapters yet. Click "Auto-Arrange" to start.
                </div>
            )}
        </div>
    );
}
