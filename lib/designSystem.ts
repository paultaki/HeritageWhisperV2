/**
 * HeritageWhisper Design System
 * Extracted from existing components and refined for consistency
 * Premium, warm, senior-friendly design language
 */

export const colors = {
  primary: {
    coral: "#E85D5D",
    coralHover: "hsl(0, 77%, 58%)",
    coralLight: "rgba(232, 93, 93, 0.1)",
    coralShadow: "rgba(232, 93, 93, 0.3)",
  },
  background: {
    cream: "#FDF6F0",
    creamLight: "#FFF8F3",
    creamDark: "#FDE7DF",
    gradient: "linear-gradient(180deg, #FFF8F3 0%, #FDE7DF 100%)",
    bookPage: "#faf8f5",
  },
  secondary: {
    bronze: "#C68A2B",
    bronzeHover: "#B37A1B",
    bronzeLight: "rgba(198, 138, 43, 0.1)",
    gold: "#D4853A",
  },
  gradients: {
    coral: "linear-gradient(90deg, #F59E0B 0%, #EC4899 100%)",
    warm: "linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)",
    cta: "linear-gradient(to right, rgb(245 158 11) 0%, rgb(239 68 68) 100%)",
    ctaReverse:
      "linear-gradient(to right, rgb(236 72 153) 0%, rgb(245 158 11) 100%)",
    amber: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
    blue: "linear-gradient(90deg, #3B82F6 0%, #6366F1 100%)",
    emerald: "linear-gradient(90deg, #10B981 0%, #059669 100%)",
  },
  text: {
    primary: "#2D2D2D",
    secondary: "#6B7280",
    muted: "#9CA3AF",
    bookText: "#3a3a3a",
    bookMuted: "#6B5D4F",
  },
  traits: {
    resilience: "#6B9BD1",
    forgiveness: "#81C784",
    courage: "#B39DDB",
    legacy: "#FFB74D",
    wisdom: "#FF8A95",
    compassion: "#64B5F6",
    determination: "#A1887F",
    gratitude: "#FFD54F",
    patience: "#AED581",
  },
} as const;

export const typography = {
  fontFamilies: {
    serif: "'Playfair Display', Georgia, serif",
    sans: "'Inter', system-ui, sans-serif",
    book: "'Crimson Text', Georgia, serif",
    mono: "Menlo, monospace",
  },
  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
  sizes: {
    // Base sizes with senior-friendly minimums
    base: "max(1rem, 18px)",
    sm: "max(0.875rem, 16px)",
    lg: "max(1.125rem, 20px)",
    xl: "max(1.25rem, 22px)",

    // Responsive heading sizes
    h1: "clamp(2rem, 5vw, 3rem)",
    h2: "clamp(1.5rem, 4vw, 2.25rem)",
    h3: "clamp(1.25rem, 3vw, 1.75rem)",
    h4: "clamp(1.125rem, 2.5vw, 1.5rem)",

    // Component-specific
    button: "max(1.125rem, 20px)",
    caption: "max(0.875rem, 14px)",

    // Mobile-specific
    mobileHero: "clamp(2.5rem, 7vw, 3rem)",
    mobileBody: "max(1rem, 17px)",
  },
  lineHeight: {
    tight: 1.3,
    normal: 1.6,
    relaxed: 1.8,
    book: 1.8,
  },
} as const;

export const spacing = {
  // Touch targets (accessibility)
  touchTarget: "44px",
  touchTargetLarge: "60px",

  // Padding/margin scale
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  xxl: "48px",
  xxxl: "64px",

  // Component-specific
  cardPadding: "24px",
  mobilePadding: "16px",
  sectionGap: "80px",

  borderRadius: {
    sm: "4px",
    md: "8px",
    lg: "16px",
    xl: "24px",
    xxl: "32px",
    full: "9999px",

    // Component-specific
    button: "24px",
    card: "24px",
    modal: "32px",
    input: "12px",
  },
} as const;

export const animations = {
  // Durations
  duration: {
    instant: "0.1s",
    fast: "0.2s",
    normal: "0.3s",
    slow: "0.5s",
    slower: "0.8s",
    slowest: "1.5s",
  },

  // Easings
  easing: {
    default: "cubic-bezier(0.4, 0, 0.2, 1)",
    easeIn: "cubic-bezier(0.4, 0, 1, 1)",
    easeOut: "cubic-bezier(0, 0, 0.2, 1)",
    bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },

  // Preset animations
  pulse: "gentle-pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  fadeUp: "fade-in-up 0.6s ease-out forwards",
  slideIn: "slide-in-right 0.5s ease-out",
  scale: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  bounce: "bounce 1s infinite",
  float: "gentleFloat 4s ease-in-out infinite",
  wave: "waveDance 0.8s ease-in-out infinite",
} as const;

export const shadows = {
  none: "none",
  sm: "0 2px 4px rgba(0,0,0,0.1)",
  md: "0 4px 12px rgba(0,0,0,0.12)",
  lg: "0 10px 24px rgba(0,0,0,0.15)",
  xl: "0 20px 40px rgba(0,0,0,0.2)",
  xxl: "0 30px 60px rgba(0,0,0,0.25)",

  // Special shadows
  coral: "0 4px 16px rgba(232, 93, 93, 0.3)",
  glow: "0 0 40px rgba(245, 166, 35, 0.4)",
  inner: "inset 0 2px 4px rgba(0,0,0,0.1)",

  // Premium multi-layer shadow
  premium: `
    0 2px 4px rgba(0,0,0,0.18),
    0 6px 12px rgba(0,0,0,0.12),
    0 16px 32px rgba(0,0,0,0.08),
    0 24px 48px rgba(0,0,0,0.04)
  `,

  // Card hover state
  cardHover: `
    0 4px 8px rgba(0,0,0,0.22),
    0 8px 16px rgba(0,0,0,0.16),
    0 20px 40px rgba(0,0,0,0.12),
    0 32px 64px rgba(0,0,0,0.08)
  `,
} as const;

export const breakpoints = {
  xs: "475px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  xxl: "1536px",
} as const;

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  toast: 80,
  navigation: 90,
} as const;

// Component-specific styles
export const components = {
  button: {
    primary: {
      background: colors.primary.coral,
      color: "white",
      borderRadius: spacing.borderRadius.button,
      padding: `12px 24px`,
      minHeight: spacing.touchTarget,
      fontSize: typography.sizes.button,
      fontWeight: typography.weights.semibold,
      boxShadow: shadows.coral,
      transition: `all ${animations.duration.normal} ${animations.easing.default}`,
      hover: {
        background: colors.primary.coralHover,
        transform: "translateY(-2px)",
        boxShadow: shadows.lg,
      },
    },
    secondary: {
      background: "white",
      color: colors.primary.coral,
      border: `2px solid ${colors.primary.coral}`,
      borderRadius: spacing.borderRadius.button,
      padding: `10px 22px`,
      minHeight: spacing.touchTarget,
      fontSize: typography.sizes.button,
      fontWeight: typography.weights.medium,
      transition: `all ${animations.duration.normal} ${animations.easing.default}`,
      hover: {
        background: colors.primary.coral,
        color: "white",
        boxShadow: shadows.coral,
      },
    },
    record: {
      width: spacing.touchTargetLarge,
      height: spacing.touchTargetLarge,
      borderRadius: spacing.borderRadius.full,
      background: colors.gradients.coral,
      boxShadow: shadows.xl,
      transition: `all ${animations.duration.normal} ${animations.easing.default}`,
      hover: {
        transform: "scale(1.1)",
        boxShadow: shadows.glow,
      },
    },
  },

  card: {
    background: "white",
    borderRadius: spacing.borderRadius.card,
    padding: spacing.cardPadding,
    boxShadow: shadows.md,
    transition: `all ${animations.duration.normal} ${animations.easing.default}`,
    hover: {
      transform: "translateY(-4px)",
      boxShadow: shadows.xl,
    },
  },

  input: {
    borderRadius: spacing.borderRadius.input,
    border: "2px solid #E5E7EB",
    padding: "12px 16px",
    fontSize: typography.sizes.base,
    minHeight: spacing.touchTarget,
    transition: `all ${animations.duration.fast} ${animations.easing.default}`,
    focus: {
      borderColor: colors.primary.coral,
      outline: "none",
      boxShadow: `0 0 0 3px ${colors.primary.coralLight}`,
    },
  },

  modal: {
    backdrop: "rgba(0, 0, 0, 0.5)",
    backdropBlur: "10px",
    borderRadius: spacing.borderRadius.modal,
    background: "white",
    padding: spacing.xl,
    boxShadow: shadows.xxl,
  },
} as const;

// Utility functions
export const utils = {
  // Apply consistent hover state
  applyHover: (styles: any) => ({
    ...styles,
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: shadows.lg,
    },
  }),

  // Apply focus state for accessibility
  applyFocus: (color = colors.primary.coral) => ({
    "&:focus-visible": {
      outline: `2px solid ${color}`,
      outlineOffset: "2px",
      boxShadow: `0 0 0 4px ${color}20`,
    },
  }),

  // Apply disabled state
  applyDisabled: () => ({
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
      transform: "none",
    },
  }),

  // Generate trait color with opacity
  getTraitColor: (trait: keyof typeof colors.traits, opacity = 1) => {
    const color = colors.traits[trait];
    return opacity < 1
      ? `${color}${Math.floor(opacity * 255).toString(16)}`
      : color;
  },
} as const;

// Export type for TypeScript
export type DesignSystem = {
  colors: typeof colors;
  typography: typeof typography;
  spacing: typeof spacing;
  animations: typeof animations;
  shadows: typeof shadows;
  breakpoints: typeof breakpoints;
  zIndex: typeof zIndex;
  components: typeof components;
  utils: typeof utils;
};

const designSystem: DesignSystem = {
  colors,
  typography,
  spacing,
  animations,
  shadows,
  breakpoints,
  zIndex,
  components,
  utils,
};

export default designSystem;
