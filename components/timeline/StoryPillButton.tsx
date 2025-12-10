/**
 * StoryPillButton - Visual indicator for story type
 *
 * Shows "Open Story" for stories with audio,
 * or "Read Story" for text-only stories.
 * Uses a retro arrow icon on the right side of the text.
 *
 * This is a visual indicator, not a button - clicking the card navigates to book view.
 */
import React from 'react';
import styles from './StoryPillButton.module.css';

type StoryPillButtonProps = {
    hasAudio: boolean;
};

// Retro Arrow SVG component
function RetroArrow({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M2 5L6 12L2 19H17L22 12L17 5H2Z" />
        </svg>
    );
}

export function StoryPillButton({ hasAudio }: StoryPillButtonProps) {
    return (
        <div
            className={styles['hw-story-pill']}
            aria-label={hasAudio ? 'Open story with audio' : 'Read story'}
        >
            <span className={styles['hw-story-pill__label']}>
                {hasAudio ? 'Open Story' : 'Read Story'}
            </span>
            <span className={styles['hw-story-pill__icon']} aria-hidden="true">
                <RetroArrow className="w-4 h-4" />
            </span>
        </div>
    );
}
