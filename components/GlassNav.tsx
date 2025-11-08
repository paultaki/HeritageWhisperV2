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
};

type GlassNavProps = {
  items: NavItem[];
  activeKey?: string;
  className?: string;
  onMenuClick?: () => void;
};

export default function GlassNav({ items, activeKey, className, onMenuClick }: GlassNavProps) {
  return (
    <nav
      data-sep="auto"
      className={cn(
        // width and shape
        "w-[92vw] max-w-[720px] rounded-[22px] overflow-hidden",
        // layout - evenly distributed spacing
        "flex items-center justify-around px-3 py-[6px]",
        // glass core - brand-aligned
        "backdrop-blur-[18px] saturate-[1.22] contrast-[1.12] brightness-[0.97]",
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
        bottom: '10px',
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
      {items.map(({ key, label, href, Icon }) => {
        const active = key === activeKey;
        const isMenu = key === 'menu';

        // For menu item, use button instead of Link
        const Component = isMenu ? 'button' : Link;
        const componentProps = isMenu
          ? {
              onClick: onMenuClick,
              type: 'button' as const,
              'data-menu-button': 'true'
            }
          : { href };

        return (
          <Component
            key={key}
            {...componentProps}
            className={cn(
              "group flex flex-col items-center justify-center px-1 py-[2px] rounded-[10px] transition-transform flex-1",
              active && "bg-black/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] -translate-y-0.5"
            )}
          >
            <Icon
              className={cn(
                "w-[18px] h-[18px]",
                active ? "text-black" : "text-black/75"
              )}
            />
            <span
              className={cn(
                "relative mt-[1px] text-[12px] leading-none font-medium",
                active ? "text-black" : "text-black/75"
              )}
            >
              {label.startsWith('+') ? (
                <>
                  <span className="text-[16px] font-bold">{label.charAt(0)}</span>
                  {label.slice(1)}
                </>
              ) : (
                label
              )}
              {active && (
                <i className="absolute left-1/2 -translate-x-1/2 -bottom-[2px] block w-5 h-[2px] rounded-full bg-black/70" />
              )}
            </span>
          </Component>
        );
      })}
    </nav>
  );
}
