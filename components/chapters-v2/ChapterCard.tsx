import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Chapter } from "@/app/chapters-v2/page";

interface ChapterCardProps {
    chapter: Chapter;
    isActive: boolean;
    onClick: () => void;
    onRename: (id: string, newTitle: string) => void;
    onDelete: (id: string) => void;
    isOverlay?: boolean;
}

export function ChapterCard({
    chapter,
    isActive,
    onClick,
    onRename,
    onDelete,
    isOverlay = false
}: ChapterCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
        isOver,
        active,
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
    const isOverChapter = isOver && active?.data.current?.type === 'story';

    if (isOverlay) {
        return (
            <div className="bg-[var(--hw-surface)] border border-[var(--hw-primary)] shadow-lg rounded-xl p-4 flex items-center gap-3 w-full max-w-sm cursor-grabbing">
                <GripVertical className="h-5 w-5 text-[var(--hw-text-muted)]" />
                <div className="font-medium text-lg text-[var(--hw-primary)]">{chapter.title}</div>
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                group relative grid grid-cols-[auto_1fr_auto] items-center gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer w-full
                ${isActive
                    ? "bg-[var(--hw-surface)] border-[var(--hw-primary)] shadow-md ring-1 ring-[var(--hw-primary)]/10"
                    : isOverChapter
                        ? "bg-[var(--hw-primary)]/5 border-[var(--hw-primary)] ring-2 ring-[var(--hw-primary)]/20 scale-[1.02]"
                        : "bg-[var(--hw-surface)] border-[var(--hw-border-subtle)] hover:border-[var(--hw-border-strong)] hover:shadow-sm"
                }
            `}
            onClick={onClick}
        >
            {/* Drag Handle */}
            <button
                {...attributes}
                {...listeners}
                className={`
                    touch-none p-1 rounded-md hover:bg-[var(--hw-section-bg)] text-[var(--hw-text-muted)] hover:text-[var(--hw-primary)] transition-colors flex-shrink-0
                    ${isUncategorized ? 'opacity-0 pointer-events-none' : ''}
                `}
            >
                <GripVertical className="h-5 w-5" />
            </button>

            {/* Content */}
            <div className="min-w-0 overflow-hidden">
                {isEditing ? (
                    <form onSubmit={handleSave} onClick={e => e.stopPropagation()}>
                        <Input
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            className="h-9 text-lg font-medium w-full"
                            autoFocus
                            onBlur={() => setIsEditing(false)}
                        />
                    </form>
                ) : (
                    <div className="flex flex-col">
                        <h3 className="font-medium text-lg text-[var(--hw-text-primary)] truncate leading-tight">
                            {chapter.title}
                        </h3>
                        <span className="text-sm text-[var(--hw-text-muted)] mt-0.5 truncate">
                            {chapter.stories.length} {chapter.stories.length === 1 ? 'story' : 'stories'}
                        </span>
                    </div>
                )}
            </div>

            {/* Actions */}
            {!isUncategorized && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[var(--hw-text-muted)] hover:text-[var(--hw-primary)] opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                        >
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setIsEditing(true);
                        }}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-[var(--hw-error)] focus:text-[var(--hw-error)]"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm("Are you sure you want to delete this chapter? Stories will be moved to Uncategorized.")) {
                                    onDelete(chapter.id);
                                }
                            }}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            {/* Spacer for grid if uncategorized (to keep 3 columns if needed, though auto handles it) */}
            {isUncategorized && <div />}
        </div>
    );
}
