"use client";

/**
 * IntroPage - Mobile book introduction page
 * Adapted from desktop BookPage intro logic
 * Premium styling with cream paper and bound-page effect
 */
export default function IntroPage() {
  return (
    <section
      className="relative h-[100dvh] w-screen flex-shrink-0 snap-start flex items-center justify-center px-4"
      style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}
    >
      {/* Premium book page - cream paper with bound-page styling */}
      <div
        className="relative w-full max-w-md h-[85vh] shadow-2xl overflow-hidden ring-1 ring-black/5"
        style={{
          backgroundColor: '#FFFDF8', // Cream paper
          borderRadius: '2px 12px 12px 2px', // Asymmetric: sharp on left (spine), rounded on right
          boxShadow: `
            inset -4px 0 8px -4px rgba(0,0,0,0.08),
            inset 4px 0 12px -4px rgba(0,0,0,0.12),
            0 10px 40px -10px rgba(0,0,0,0.5)
          `,
        }}
      >
        {/* Subtle paper texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: '2px 12px 12px 2px',
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            opacity: 0.035,
          }}
        />

        {/* Subtle vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: '2px 12px 12px 2px',
            background:
              "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.05) 100%)",
          }}
        />

        {/* Content */}
        <div className="relative h-full flex items-center justify-center p-8">
          <div className="text-center space-y-8">
            <h1
              className="text-5xl font-serif text-gray-800 mb-4"
              style={{ fontFamily: "Crimson Text, serif" }}
            >
              Family Memories
            </h1>
            <div className="w-24 h-1 bg-indigo-500 mx-auto"></div>
            <p className="text-lg text-gray-600 leading-relaxed max-w-sm italic">
              A collection of cherished moments, stories, and lessons from a
              life well-lived.
            </p>
            <p className="text-base text-gray-500 mt-8">
              These pages hold the precious memories that shaped our
              family&apos;s journey.
            </p>
          </div>
        </div>

        {/* Inner edge shadow for book effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: '2px 12px 12px 2px',
            boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.02), inset 0 -1px 0 rgba(0,0,0,0.02)',
          }}
        />
      </div>
    </section>
  );
}
