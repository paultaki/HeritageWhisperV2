import React from 'react';
import { Play, Pause } from 'lucide-react';
import styles from './PlayPillButton.module.css';

type PlayPillButtonProps = {
    isPlaying: boolean;
    progress: number; // 0 to 100
    onClick: (e: React.MouseEvent) => void;
    label?: string;
    playingLabel?: string;
};

export function PlayPillButton({
    isPlaying,
    progress,
    onClick,
    label = 'Play story',
    playingLabel = 'Playing...'
}: PlayPillButtonProps) {
    // Normalize progress to 0-1 for the CSS variable
    const normalizedProgress = Math.max(0, Math.min(1, (progress || 0) / 100));

    return (
        <button
            type="button"
            className={styles['hw-play-pill']}
            onClick={onClick}
            aria-label={isPlaying ? 'Pause story' : 'Play story'}
            style={{ ['--progress' as any]: normalizedProgress }}
        >
            <span className={styles['hw-play-pill__icon']} aria-hidden="true">
                <svg className={styles['hw-play-pill__ring']} viewBox="0 0 32 32">
                    <circle className={styles['hw-play-pill__ring-track']} cx="16" cy="16" r="13" />
                    <circle className={styles['hw-play-pill__ring-progress']} cx="16" cy="16" r="13" />
                </svg>
                <span className={styles['hw-play-pill__triangle']}>
                    {isPlaying ? (
                        <Pause size={10} fill="currentColor" className="text-current" />
                    ) : (
                        <Play size={10} fill="currentColor" className="text-current ml-0.5" />
                    )}
                </span>
            </span>
            <span className={styles['hw-play-pill__label']}>
                {isPlaying ? playingLabel : label}
            </span>
        </button>
    );
}
