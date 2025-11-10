/**
 * Design Tokens for Treasure Cards
 *
 * Centralized design system tokens following industry best practices:
 * - Material Design elevation levels (2dp, 4dp, 8dp)
 * - 120ms micro-interactions (industry standard)
 * - WCAG 2.1 AA compliant accessibility
 * - Senior-friendly 44px minimum touch targets
 */

export const TREASURE_TOKENS = {
  // Card appearance
  card: {
    radius: 'rounded-2xl',        // 16px border radius
    border: 'border border-black/8', // 8% opacity for warmth
    elevation: {
      rest: 'shadow-sm',          // 2dp equivalent - subtle resting state
      hover: 'shadow-lg',         // 4dp equivalent - elevated on hover
      active: 'shadow-xl',        // 8dp equivalent - pressed state
    },
    hover: {
      transform: 'hover:-translate-y-1',  // 2px lift on hover
      transition: 'transition-all duration-200', // 200ms standard transition
    },
  },

  // Typography scale
  typography: {
    title: {
      size: 'text-xl',            // 20px (up from 18px)
      weight: 'font-semibold',    // 600 weight
      lines: 'line-clamp-2',      // Truncate to 2 lines with ellipsis
    },
    meta: {
      size: 'text-xs',            // 12px for year • category
      color: 'text-gray-600',     // Muted but readable
      height: 'leading-relaxed',  // 1.6 line height
    },
  },

  // Chip/badge styling
  chip: {
    neutral: 'bg-gray-100 text-gray-700', // Neutral for categories
    favorite: 'text-red-500',              // Red for favorite state only
    height: 'py-1 px-2.5',                 // 28-32px total height
    radius: 'rounded-full',                // Pill shape
  },

  // Photo container
  photo: {
    aspectRatio: '16/10',                  // Consistent aspect ratio
    innerStroke: 'ring-1 ring-inset ring-black/10', // Sharpens edges on retina
  },

  // Animation timing (based on industry research)
  animation: {
    microInteraction: 120,      // ms - Favorite toggle, quick feedback
    transition: 200,            // ms - Hover states, UI changes
    moderate: 300,              // ms - Slower, emphasized transitions
  },

  // Accessibility standards (WCAG 2.1 AA)
  accessibility: {
    minTouchTarget: 44,         // px - Minimum for senior-friendly UI
    focusRing: 'ring-2 ring-heritage-brown ring-offset-2',
  },

  // Section headers
  section: {
    header: {
      size: 'text-sm',
      weight: 'font-semibold',
      color: 'text-gray-500',
      transform: 'uppercase',
      tracking: 'tracking-wider',
    },
  },
} as const;

/**
 * Helper function to get animation duration in CSS format
 */
export const getAnimationDuration = (type: keyof typeof TREASURE_TOKENS.animation): string => {
  return `${TREASURE_TOKENS.animation[type]}ms`;
};
