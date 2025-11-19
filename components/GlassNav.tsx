// components/GlassNav.tsx
"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type NavItem = {
  key: string;
  label: string;
  href: string;
  Icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onClick?: () => void;
};

type GlassNavProps = {
  items: NavItem[];
  activeKey?: string;
  className?: string;
  onMenuClick?: () => void;
  id?: string;
  dataInk?: "dark" | "light";
  isAssertive?: boolean;
};

export default function GlassNav({
  items,
  activeKey,
  className,
  onMenuClick,
  id,
  dataInk = "dark",
  isAssertive = false,
}: GlassNavProps) {
  return (
    <nav
      id={id}
      data-sep="auto"
      data-ink={dataInk}
      className={cn(
        // width and shape - responsive with safe margins
        "w-[86vw] max-w-[400px] rounded-[22px] overflow-hidden",
        // layout - evenly distributed spacing with more breathing room
        "flex items-center justify-around px-4 py-1.5",
        // glass core - brand-aligned (conditional on assertive mode)
        isAssertive
          ? "backdrop-blur-[22px] saturate-[1.15] contrast-[1.25] brightness-[0.92]" // Assertive: stronger separation for photos
          : "backdrop-blur-[18px] saturate-[1.22] contrast-[1.12] brightness-[0.97]", // Normal: balanced glass effect
        "border border-white/35",
        "shadow-[0_20px_40px_-20px_rgba(0,0,0,0.45)]",
        // taupe tint based on brand color #866C7A
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.04))]",
        "bg-[rgba(134,108,122,0.12)]",
        "relative",
        // subtle edge shadow for lift
        "after:content-[''] after:absolute after:inset-x-4 after:-bottom-2 after:h-3 after:rounded-[20px] after:blur-[14px] after:bg-black/10 after:pointer-events-none",
        className
      )}
      style={{
        position: 'fixed',
        bottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
      }}
    >
      {/* refraction layer – more subtle */}
      <span
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-[-6%] opacity-15
          bg-inherit
          [background-attachment:fixed]
          blur-[4px]
        "
        style={{
          transform: "translate(0.8px,0.8px) scale(1.012)",
        }}
      />

      {/* Luminance-aware scrim - auto darken/lighten background */}
      <span
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0 z-0
          mix-blend-multiply opacity-60
          bg-[radial-gradient(120%_200%_at_50%_-80%,rgba(134,108,122,0.20),transparent_55%),
              linear-gradient(0deg,rgba(134,108,122,0.15),transparent_40%)]
        "
      />

      {/* top lip highlight (always on) */}
      <span
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0
          [background:linear-gradient(180deg,rgba(255,255,255,0.28),transparent_42%)]
        "
      />

      {/* bottom fade (conditional - only when data-sep="strong") */}
      <span
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0 hidden
          [background:linear-gradient(0deg,rgba(0,0,0,0.10),transparent_40%)]
          data-[sep='strong']:block
        "
      />

      {/* items */}
      {items.map(({ key, label, href, Icon, onClick }) => {
        const active = key === activeKey;
        const isMenu = key === 'menu';
        const hasOnClick = !!onClick || isMenu;

        const sharedClassName = cn(
          "group flex flex-col items-center justify-center px-1.5 py-1.5 rounded-[10px] transition-all duration-200 flex-1 gap-0.5",
          // Hover states - conditional on ink color
          dataInk === "light"
            ? "hover:bg-white/8 hover:scale-105"
            : "hover:bg-black/6 hover:scale-105",
          // Active states - conditional on ink color
          active && dataInk === "light" && "bg-white/15 shadow-[inset_0_1px_0_rgba(0,0,0,0.15)] -translate-y-0.5",
          active && dataInk === "dark" && "bg-black/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] -translate-y-0.5"
        );

        const content = (
          <>
            {Icon && (
              <Icon
                className={cn(
                  "w-[18px] h-[18px] transition-colors duration-200",
                  // Icon colors - conditional on ink and active state
                  dataInk === "light"
                    ? "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.30)]"
                    : active
                    ? "text-black"
                    : "text-black/85" // Boosted from /75 for better visibility
                )}
              />
            )}
            <span
              className={cn(
                "relative text-[11px] leading-tight font-medium transition-colors duration-200",
                // Label colors - conditional on ink and active state
                dataInk === "light"
                  ? "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.30)]"
                  : active
                  ? "text-black"
                  : "text-black/85" // Boosted from /75 for better visibility
              )}
            >
              {label.startsWith('+') ? (
                <>
                  <span className="text-[13px] font-bold">{label.charAt(0)}</span>
                  {label.slice(1)}
                </>
              ) : (
                label
              )}
              {active && (
                <i
                  className={cn(
                    "absolute left-1/2 -translate-x-1/2 -bottom-[2px] block w-5 h-[2px] rounded-full",
                    dataInk === "light" ? "bg-white/90" : "bg-black/70"
                  )}
                />
              )}
            </span>
          </>
        );

        // Render either button or Link based on hasOnClick
        return hasOnClick ? (
          <button
            key={key}
            onClick={isMenu ? onMenuClick : onClick}
            type="button"
            data-nav-button={key}
            className={sharedClassName}
          >
            {content}
          </button>
        ) : (
          <Link key={key} href={href} className={sharedClassName}>
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
