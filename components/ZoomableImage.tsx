"use client";

/**
 * ZoomableImage Component
 *
 * A touch-enabled image component with pinch-to-zoom and pan capabilities.
 * Features:
 * - Pinch-to-zoom (1x to 4x scale)
 * - Pan/drag when zoomed in
 * - Bounds constraints (can't pan past image edges)
 * - Double-tap to toggle between 1x and 2x zoom
 * - Smooth spring animations
 * - Proper touch-action handling for mobile
 * - Reset zoom when resetKey changes
 */

import { useRef, useState, useCallback, useEffect } from "react";
import { useGesture } from "@use-gesture/react";
import { motion, useSpring, useMotionValue } from "framer-motion";

interface ZoomableImageProps {
    src: string;
    alt: string;
    className?: string;
    style?: React.CSSProperties;
    resetKey?: string | number; // Changes trigger zoom reset
    onTap?: () => void; // Optional tap handler (for closing lightbox on backdrop)
}

// Spring config for smooth animations
const springConfig = { stiffness: 300, damping: 30, mass: 1 };

export function ZoomableImage({
    src,
    alt,
    className = "",
    style = {},
    resetKey,
    onTap,
}: ZoomableImageProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    // Motion values for smooth animations
    const scale = useMotionValue(1);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Animated spring values
    const animatedScale = useSpring(scale, springConfig);
    const animatedX = useSpring(x, springConfig);
    const animatedY = useSpring(y, springConfig);

    // Track current scale for bounds calculation
    const [currentScale, setCurrentScale] = useState(1);

    // Track last tap time for double-tap detection
    const lastTapRef = useRef<number>(0);

    // Reset zoom when resetKey changes (e.g., navigating carousel)
    useEffect(() => {
        scale.set(1);
        x.set(0);
        y.set(0);
        setCurrentScale(1);
    }, [resetKey, scale, x, y]);

    // Calculate bounds based on current scale
    const getBounds = useCallback(() => {
        const container = containerRef.current;
        const image = imageRef.current;
        if (!container || !image) return { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } };

        const containerRect = container.getBoundingClientRect();
        const scaledWidth = image.offsetWidth * currentScale;
        const scaledHeight = image.offsetHeight * currentScale;

        // How much the image exceeds the container when scaled
        const overflowX = Math.max(0, (scaledWidth - containerRect.width) / 2);
        const overflowY = Math.max(0, (scaledHeight - containerRect.height) / 2);

        return {
            x: { min: -overflowX, max: overflowX },
            y: { min: -overflowY, max: overflowY },
        };
    }, [currentScale]);

    // Clamp value to bounds
    const clamp = (value: number, min: number, max: number) =>
        Math.min(Math.max(value, min), max);

    // Handle double-tap to zoom
    const handleDoubleTap = useCallback(() => {
        const targetScale = currentScale < 1.5 ? 2 : 1;
        scale.set(targetScale);
        setCurrentScale(targetScale);

        // Reset position when zooming out
        if (targetScale === 1) {
            x.set(0);
            y.set(0);
        }
    }, [currentScale, scale, x, y]);

    // Combined gesture handler
    useGesture(
        {
            onPinch: ({ offset: [s], memo }) => {
                // Clamp scale between 1x and 4x
                const newScale = clamp(s, 1, 4);
                scale.set(newScale);
                setCurrentScale(newScale);

                // Adjust position to stay within bounds at new scale
                const bounds = getBounds();
                x.set(clamp(x.get(), bounds.x.min, bounds.x.max));
                y.set(clamp(y.get(), bounds.y.min, bounds.y.max));

                return memo;
            },
            onPinchEnd: () => {
                // Snap back to 1x if close
                if (currentScale < 1.1) {
                    scale.set(1);
                    x.set(0);
                    y.set(0);
                    setCurrentScale(1);
                }
            },
            onDrag: ({ offset: [ox, oy], pinching, tap, event }) => {
                // Ignore drag during pinch
                if (pinching) return;

                // Handle tap/double-tap
                if (tap) {
                    const now = Date.now();
                    const timeSinceLastTap = now - lastTapRef.current;

                    if (timeSinceLastTap < 300) {
                        // Double-tap detected
                        handleDoubleTap();
                        lastTapRef.current = 0;
                    } else {
                        lastTapRef.current = now;
                        // Single tap - could trigger onTap after delay if not double-tap
                        setTimeout(() => {
                            if (lastTapRef.current === now && onTap && currentScale <= 1) {
                                onTap();
                            }
                        }, 300);
                    }
                    return;
                }

                // Only allow panning when zoomed in
                if (currentScale <= 1) return;

                // Apply bounds
                const bounds = getBounds();
                x.set(clamp(ox, bounds.x.min, bounds.x.max));
                y.set(clamp(oy, bounds.y.min, bounds.y.max));
            },
        },
        {
            target: containerRef,
            eventOptions: { passive: false },
            pinch: {
                scaleBounds: { min: 1, max: 4 },
                rubberband: true,
            },
            drag: {
                from: () => [x.get(), y.get()],
                bounds: () => {
                    const b = getBounds();
                    return { left: b.x.min, right: b.x.max, top: b.y.min, bottom: b.y.max };
                },
                rubberband: true,
                filterTaps: true,
                pointer: { touch: true },
            },
        }
    );

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden ${className}`}
            style={{
                touchAction: "none", // Prevent browser gestures
                ...style,
            }}
        >
            <motion.img
                ref={imageRef}
                src={src}
                alt={alt}
                className="w-full h-full object-contain select-none"
                style={{
                    scale: animatedScale,
                    x: animatedX,
                    y: animatedY,
                    transformOrigin: "center center",
                }}
                draggable={false}
            />
        </div>
    );
}
