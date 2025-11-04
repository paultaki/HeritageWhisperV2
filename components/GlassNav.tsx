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
        // layout - compact with even spacing
        "flex items-center justify-evenly px-4 py-1",
        // glass core - brand-aligned
        "backdrop-blur-[18px] saturate-[1.22] contrast-[1.12] brightness-[0.97]",
        "border border-white/35",
        "shadow-[0_20px_40px_-20px_rgba(0,0,0,0.45)]",
        // taupe tint based on brand color #866C7A
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.04))]",
        "bg-[rgba(134,108,122,0.12)]",
        "relative",
        // subtle edge shadow for lift
        "after:content-[''] after:absolute after:inset-x-4 after:-bottom-3 after:h-4 after:rounded-[20px] after:blur-[14px] after:bg-black/10 after:pointer-events-none",
        className
      )}
      style={{
        position: 'fixed',
        bottom: '20px',
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
          ? { onClick: onMenuClick, type: 'button' as const }
          : { href };

        return (
          <Component
            key={key}
            {...componentProps}
            className={cn(
              "flex flex-col items-center px-2 py-1 rounded-[14px] transition-transform",
              "hover:-translate-y-0.5"
            )}
          >
            <span
              className={cn(
                "grid place-items-center w-7 h-7 rounded-full",
                active
                  ? "bg-black/6 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
                  : "bg-transparent"
              )}
            >
              {Icon ? (
                <Icon
                  className={cn(
                    "w-[18px] h-[18px]",
                    active ? "text-black" : "text-black/85",
                    "drop-shadow-[0_1px_0_rgba(255,255,255,0.55)]"
                  )}
                />
              ) : null}
            </span>
            <span
              className={cn(
                "text-[12px] font-medium leading-none tracking-wide mt-[2px]",
                "text-black/85",
                "drop-shadow-[0_1px_0_rgba(255,255,255,0.55)]",
                active && "text-black"
              )}
            >
              {label}
            </span>
          </Component>
        );
      })}
    </nav>
  );
}
