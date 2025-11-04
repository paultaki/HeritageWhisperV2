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
        // positioning
        "fixed left-1/2 -translate-x-1/2 bottom-5 z-[100]",
        // layout
        "flex items-center gap-7 px-6 py-3",
        // shape
        "rounded-[22px] overflow-hidden",
        // iOS-ish glass look
        "backdrop-blur-[18px] saturate-[1.25] contrast-[1.08] brightness-[1.06]",
        "border border-white/30",
        "shadow-[0_20px_40px_-20px_rgba(0,0,0,0.35)]",
        // tint + vertical sheen
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.06))] bg-white/5",
        "relative",
        className
      )}
    >
      {/* fake refraction layer */}
      <span
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-[-8%] opacity-40
          bg-inherit
          [background-attachment:fixed]
          blur-[6px] scale-[1.02] translate-x-[1.5px] translate-y-[1.5px]
        "
        style={{
          // needed so Tailwind doesn't strip our transforms
          transform: "translate(1.5px,1.5px) scale(1.02)",
        }}
      />

      {/* top lip highlight */}
      <span
        aria-hidden="true"
        className="
          pointer-events-none absolute inset-0
          [background:linear-gradient(180deg,rgba(255,255,255,0.35),transparent_45%)]
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
                    active ? "text-white" : "text-white/80"
                  )}
                />
              ) : null}
            </span>
            <span
              className={cn(
                "text-[13px] tracking-wide",
                active ? "text-white" : "text-white/80"
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
