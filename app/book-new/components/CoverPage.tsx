"use client";

/**
 * CoverPage - Mobile book cover display (closed book)
 * Adapted from desktop ClosedBookCover component
 */
export default function CoverPage({
  userName,
  storyCount,
}: {
  userName: string;
  storyCount: number;
}) {
  return (
    <section
      className="relative h-[100dvh] w-screen flex-shrink-0 snap-start flex items-center justify-center"
      style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}
      data-nav-ink="light"
    >
      <div
        className="relative mx-auto"
        style={{
          width: "min(85vw, calc((100dvh - 180px) * 0.647))",
          aspectRatio: "5.5 / 8.5",
          maxWidth: "600px",
        }}
      >
        {/* Ambient shadow */}
        <div className="pointer-events-none absolute -inset-8 rounded-2xl bg-[radial-gradient(1000px_400px_at_50%_30%,rgba(139,111,71,0.15)_0%,rgba(139,111,71,0.08)_35%,transparent_70%)]"></div>
        <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[0_40px_120px_-30px_rgba(0,0,0,0.6)]"></div>

        {/* Book cover with spine */}
        <div className="relative w-full h-full">
          {/* Book spine (left edge) */}
          <div
            className="absolute left-0 top-0 bottom-0 rounded-l-lg pointer-events-none"
            style={{
              width: "32px",
              background:
                "linear-gradient(90deg, #1a0f08 0%, #2d1f12 50%, #3a2818 100%)",
              boxShadow:
                "inset -2px 0 8px rgba(0,0,0,0.6), inset 2px 0 4px rgba(0,0,0,0.3)",
              borderRight: "1px solid rgba(0,0,0,0.4)",
            }}
          >
            {/* Spine ridges */}
            <div className="absolute inset-y-8 left-1/2 -translate-x-1/2 w-0.5 bg-black/20"></div>
            <div className="absolute inset-y-8 left-1/3 w-px bg-black/15"></div>
            <div className="absolute inset-y-8 right-1/3 w-px bg-black/15"></div>
          </div>

          {/* Main cover */}
          <div
            className="relative w-full h-full"
            style={{
              borderRadius: "0 12px 12px 0",
              background:
                "linear-gradient(145deg, #4a3420 0%, #2d1f12 50%, #1a0f08 100%)",
              boxShadow:
                "0 25px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(139,111,71,0.15), inset 0 -1px 0 rgba(0,0,0,0.5), inset -3px 0 10px rgba(0,0,0,0.4)",
            }}
          >
            {/* Leather grain texture */}
            <div
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                borderRadius: "0 12px 12px 0",
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='leather'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' seed='1' /%3E%3CfeColorMatrix type='saturate' values='0.1'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23leather)' opacity='0.6'/%3E%3C/svg%3E")`,
                backgroundSize: "200px 200px",
              }}
            ></div>

            {/* Subtle highlight along edges */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: "0 12px 12px 0",
                background:
                  "radial-gradient(ellipse at 20% 20%, rgba(139,111,71,0.25) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(139,111,71,0.15) 0%, transparent 50%)",
              }}
            ></div>

            {/* Vignette for depth */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: "0 12px 12px 0",
                background:
                  "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)",
              }}
            ></div>

            {/* Book crease shadow (where the book opens) */}
            <div
              className="absolute top-0 bottom-0 left-0 pointer-events-none"
              style={{
                width: "24px",
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 20%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 80%, transparent 100%)",
              }}
            ></div>

            {/* Embossed border frame (like real book covers) */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: "48px",
                left: "48px",
                right: "48px",
                bottom: "48px",
                border: "2px solid rgba(0,0,0,0.3)",
                borderRadius: "8px",
                boxShadow:
                  "inset 0 1px 0 rgba(139,111,71,0.15), 0 1px 2px rgba(0,0,0,0.5)",
              }}
            ></div>

            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-serif mb-6 tracking-tight"
                style={{
                  fontFamily: "Crimson Text, serif",
                  color: "#d4af87",
                  textShadow:
                    "0 3px 6px rgba(0,0,0,0.9), 0 -1px 2px rgba(255,255,255,0.1)",
                  fontWeight: 600,
                }}
              >
                {userName}&apos;s
                <br />
                Story
              </h1>

              <div
                className="w-32 h-0.5 mb-6"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, #d4af87, transparent)",
                }}
              ></div>

              <p
                className="text-xl md:text-2xl font-medium"
                style={{
                  color: "#c4a87a",
                  textShadow: "0 2px 4px rgba(0,0,0,0.7)",
                }}
              >
                {storyCount} {storyCount === 1 ? "memory" : "memories"}
              </p>

              <div
                className="mt-12 px-5 py-2 rounded-full border"
                style={{
                  backgroundColor: "rgba(212, 175, 135, 0.08)",
                  borderColor: "rgba(212, 175, 135, 0.25)",
                }}
              >
                <p className="text-sm font-medium" style={{ color: "#d4af87" }}>
                  Swipe to open
                </p>
              </div>
            </div>

            {/* Decorative embossed corner accents inside the border */}
            <div
              className="absolute top-14 left-14 w-8 h-8 border-l border-t rounded-tl"
              style={{
                borderColor: "rgba(212, 175, 135, 0.25)",
                filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.6))",
              }}
            ></div>
            <div
              className="absolute top-14 right-14 w-8 h-8 border-r border-t rounded-tr"
              style={{
                borderColor: "rgba(212, 175, 135, 0.25)",
                filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.6))",
              }}
            ></div>
            <div
              className="absolute bottom-14 left-14 w-8 h-8 border-l border-b rounded-bl"
              style={{
                borderColor: "rgba(212, 175, 135, 0.25)",
                filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.6))",
              }}
            ></div>
            <div
              className="absolute bottom-14 right-14 w-8 h-8 border-r border-b rounded-br"
              style={{
                borderColor: "rgba(212, 175, 135, 0.25)",
                filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.6))",
              }}
            ></div>
          </div>
        </div>
      </div>
    </section>
  );
}
