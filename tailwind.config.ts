import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Glass navigation effects
    'blur-[4px]',
    'blur-[5px]',
    'blur-[6px]',
    'blur-[14px]',
    'scale-[1.012]',
    'scale-[1.02]',
    'scale-[1.015]',
    'translate-x-[1.5px]',
    'translate-y-[1.5px]',
    'backdrop-blur-[18px]',
    'backdrop-blur-[22px]', // Assertive mode
    'saturate-[1.15]', // Assertive mode
    'saturate-[1.22]',
    'saturate-[1.25]',
    'contrast-[1.08]',
    'contrast-[1.12]',
    'contrast-[1.15]',
    'contrast-[1.25]', // Assertive mode
    'brightness-[0.92]', // Assertive mode
    'brightness-[0.96]',
    'brightness-[0.97]',
    'brightness-[1.06]',
    'rounded-[14px]',
    'rounded-[20px]',
    'rounded-[22px]',
    'rounded-[24px]',
    'drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]',
    'drop-shadow-[0_1px_0_rgba(255,255,255,0.55)]',
    'drop-shadow-[0_1px_1px_rgba(0,0,0,0.30)]', // Light ink drop shadow
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        heritage: {
          orange: "#FF9B47",
          coral: "#FF6B8A",
          brown: "#8B4513",
          "warm-bg": "#FFF8F3",
          "warm-bg-light": "#FFFBF7",
          // New Design Guidelines (v2025)
          "deep-slate": "#203954", // Primary - Deep Slate Blue
          "muted-green": "#3E6A5A", // Secondary - Muted Green
          "gold": "#CBA46A", // Premium Accent - Gold
          "warm-paper": "#F7F2EC", // Background - Warm Paper
          "text-primary": "#1F1F1F", // Text - Near Black
        },
        // Landing V2 Theme Colors
        cream: {
          100: "#FBF9F6",
          200: "#F7F2EC",
          300: "#EBE2D5",
        },
        navy: {
          800: "#2C4259",
          900: "#1D3147",
        },
        green: {
          700: "#2D7A61",
          800: "#1F5F4A",
          900: "#164636",
        },
        gold: {
          400: "#E5C095",
          500: "#D4A574",
          600: "#B58554",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        pulse: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.2)", opacity: "0.7" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        pulse: "pulse 1.5s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
