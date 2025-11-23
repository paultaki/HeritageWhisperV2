"use client";

/**
 * IntroPage - Mobile book introduction page
 * Adapted from desktop BookPage intro logic
 */
export default function IntroPage() {
  return (
    <section
      className="relative h-[100dvh] w-screen flex-shrink-0 snap-start flex items-center justify-center px-4"
      style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}
    >
      {/* Page background - styled like a book page */}
      <div
        className="relative w-full max-w-md h-[85vh] rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: "linear-gradient(to bottom, #faf9f7, #f5f3f0)",
        }}
      >
        {/* Paper texture */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E")`,
            backgroundSize: "100px 100px",
          }}
        ></div>

        {/* Subtle vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.08) 100%)",
          }}
        ></div>

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
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{
            boxShadow: "inset 0 0 20px rgba(0,0,0,0.1)",
          }}
        ></div>
      </div>
    </section>
  );
}
