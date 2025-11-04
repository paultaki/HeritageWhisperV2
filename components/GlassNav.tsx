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
      className={cn(
        // width and shape
        "w-[92vw] max-w-[720px] rounded-[24px] overflow-hidden",
        // layout
        "flex items-center justify-between gap-7 px-6 py-3",
        // glass core - enhanced for visibility
        "backdrop-blur-[18px] saturate-[1.25] contrast-[1.15] brightness-[0.96]",
        "border border-white/35",
        "shadow-[0_20px_40px_-20px_rgba(0,0,0,0.45)]",
        // darker neutral tint for better contrast
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.10),rgba(255,255,255,0.04))]",
        "bg-[rgba(92,92,92,0.12)]",
        "relative",
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
      {/* refraction layer – subtle */}
      <span
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-[-8%] opacity-20
          bg-inherit
          [background-attachment:fixed]
          blur-[5px]
        "
        style={{
          transform: "translate(1px,1px) scale(1.015)",
        }}
      />

      {/* top lip + bottom fade for separation on light cards */}
      <span
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0
          [background:linear-gradient(180deg,rgba(255,255,255,0.28),transparent_40%),linear-gradient(0deg,rgba(0,0,0,0.10),transparent_40%)]
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
              "flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-transform",
              "hover:-translate-y-0.5"
            )}
          >
            <span
              className={cn(
                "grid place-items-center w-7 h-7 rounded-full",
                active
                  ? "bg-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
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
                "text-[13px] tracking-wide",
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
