"use client"

import type React from "react"
import { cn } from "@/lib/utils"

interface AmbientSpotlightProps {
  children: React.ReactNode
  className?: string
  intensity?: number
  color?: string
}

/**
 * Ambient Spotlight - Stage lighting effect from above
 * Creates a concentrated beam of light from the top center
 */
export function AmbientSpotlight({
  children,
  className,
  intensity = 0.3,
  color = "rgba(255, 255, 255, 0.3)",
}: AmbientSpotlightProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Content */}
      <div className="relative z-0">{children}</div>

      {/* Stage spotlight effect - beam from top center */}
      <div
        className="pointer-events-none absolute inset-0 z-50"
        style={{
          background: `radial-gradient(ellipse 800px 1200px at 50% -20%, ${color} 0%, transparent 70%)`,
          opacity: intensity,
        }}
      />
    </div>
  )
}
