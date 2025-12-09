/**
 * StoryPillButton - Visual indicator for story type
 *
 * Shows "Open Story" (with headphone icon) for stories with audio,
 * or "Read Story" (with document icon) for text-only stories.
 *
 * This is a visual indicator, not a button - clicking the card navigates to book view.
 */
import React from 'react';
import { Headphones, FileText } from 'lucide-react';
import styles from './StoryPillButton.module.css';

type StoryPillButtonProps = {
    hasAudio: boolean;
};

export function StoryPillButton({ hasAudio }: StoryPillButtonProps) {
    return (
        <div
            className={styles['hw-story-pill']}
            aria-label={hasAudio ? 'Open story with audio' : 'Read story'}
        >
            <span className={styles['hw-story-pill__icon']} aria-hidden="true">
                {hasAudio ? (
                    <Headphones size={14} className="text-current" />
                ) : (
                    <FileText size={14} className="text-current" />
                )}
            </span>
            <span className={styles['hw-story-pill__label']}>
                {hasAudio ? 'Open story' : 'Read story'}
            </span>
        </div>
    );
}
