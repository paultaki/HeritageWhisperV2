"use client";

import { useState } from "react";
import { Play, Pause } from "lucide-react";

// Mock data for demonstration using real HW media
const mockStories = [
  {
    id: "1",
    title: "The Boy Who Became My Father",
    year: "1934",
    age: "Before birth",
    lifeChapter: "Family History",
    imageUrl: "/demo-dad-boy.png",
    audioUrl: "/sample-audio.mp3",
    hasAudio: true,
  },
  {
    id: "2",
    title: "Dad's War Years",
    year: "1944",
    age: "Before birth",
    lifeChapter: "Family History",
    imageUrl: "/demo-dad-ww2.png",
    audioUrl: "/sample-audio.mp3",
    hasAudio: true,
  },
  {
    id: "3",
    title: "Buying Our First Home",
    year: "1948",
    age: "Before birth",
    lifeChapter: "Family History",
    imageUrl: "/demo-first-home.webp",
    audioUrl: "/sample-audio.mp3",
    hasAudio: true,
  },
];

function StoryCard({ story }: { story: (typeof mockStories)[0] }) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  return (
    <div
      className="hw-card"
      style={{ "--title-offset": "180px" } as React.CSSProperties}
    >
      <span className="hw-year">{story.year}</span>
      <div style={{ position: "relative" }}>
        <img className="hw-card-media" src={story.imageUrl} alt={story.title} />
        {story.hasAudio && (
          <button
            className="hw-play"
            onClick={handlePlayClick}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause style={{ fill: "var(--color-accent)" }} />
            ) : (
              <Play
                style={{ fill: "var(--color-accent)", marginLeft: "2px" }}
              />
            )}
          </button>
        )}
      </div>
      <div className="hw-card-body">
        <h3 className="hw-card-title">{story.title}</h3>
        <div className="hw-meta">
          <span>{story.year}</span>
          <span className="divider"></span>
          <span>{story.age}</span>
          <span className="divider"></span>
          <span>{story.lifeChapter}</span>
        </div>
      </div>
      <div className="hw-card-provenance">
        Recorded with Heritage Whisper · Created May 2025 · Last edited Oct 2025
      </div>
    </div>
  );
}

export default function DesignDemo() {
  return (
    <div
      style={{ minHeight: "100vh", padding: "var(--space-10) var(--space-6)" }}
    >
      {/* Header */}
      <header style={{ maxWidth: "1200px", margin: "0 auto var(--space-10)" }}>
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "var(--h1-desk)",
            color: "var(--color-text-h)",
            marginBottom: "var(--space-3)",
          }}
        >
          Design Token System Demo
        </h1>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--meta)",
            color: "var(--color-text-muted)",
          }}
        >
          Demonstrating the new token-based design system with semantic classes
        </p>
      </header>

      {/* Timeline */}
      <main
        className="hw-spine"
        style={{ maxWidth: "1200px", margin: "0 auto" }}
      >
        {/* Decade Section: Before I Was Born */}
        <section className="hw-decade">
          <div className="hw-decade-band">
            <div className="title">Before I Was Born</div>
            <div className="meta">
              Family History · Stories of those who came before
            </div>
          </div>
          <div className="hw-decade-start"></div>

          <div className="hw-grid">
            {mockStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </section>

        {/* Decade Section: The 1950s */}
        <section className="hw-decade">
          <div className="hw-decade-band">
            <div className="title">The 1950s</div>
            <div className="meta">Ages 0-10 · Childhood</div>
          </div>
          <div className="hw-decade-start"></div>

          <div className="hw-grid">
            <div
              className="hw-card"
              style={{ "--title-offset": "180px" } as React.CSSProperties}
            >
              <span className="hw-year">1955</span>
              <div style={{ position: "relative" }}>
                <img
                  className="hw-card-media"
                  src="/demo-earliest-memory.webp"
                  alt="Earliest Memory"
                />
                <button className="hw-play" aria-label="Play">
                  <Play
                    style={{ fill: "var(--color-accent)", marginLeft: "2px" }}
                  />
                </button>
              </div>
              <div className="hw-card-body">
                <h3 className="hw-card-title">My Earliest Memory</h3>
                <div className="hw-meta">
                  <span>1955</span>
                  <span className="divider"></span>
                  <span>Age 5</span>
                  <span className="divider"></span>
                  <span>Childhood</span>
                </div>
              </div>
              <div className="hw-card-provenance">
                Recorded with Heritage Whisper · Created Jun 2025 · Last edited
                Oct 2025
              </div>
            </div>

            <div
              className="hw-card"
              style={{ "--title-offset": "180px" } as React.CSSProperties}
            >
              <span className="hw-year">1958</span>
              <div style={{ position: "relative" }}>
                <img
                  className="hw-card-media"
                  src="/demo-campfire.png"
                  alt="Campfire Roll Call"
                />
                <button className="hw-play" aria-label="Play">
                  <Play
                    style={{ fill: "var(--color-accent)", marginLeft: "2px" }}
                  />
                </button>
              </div>
              <div className="hw-card-body">
                <h3 className="hw-card-title">Campfire Roll Call</h3>
                <div className="hw-meta">
                  <span>1958</span>
                  <span className="divider"></span>
                  <span>Age 8</span>
                  <span className="divider"></span>
                  <span>Summer Camp</span>
                </div>
              </div>
              <div className="hw-card-provenance">
                Recorded with Heritage Whisper · Created Aug 2025 · Last edited
                Oct 2025
              </div>
            </div>
          </div>
        </section>

        {/* Token Display Reference */}
        <section
          style={{
            marginTop: "var(--space-10)",
            padding: "var(--space-8)",
            background: "white",
            borderRadius: "var(--radius-card)",
            border: "1px solid var(--color-border)",
          }}
        >
          <h2 className="hw-decade" style={{ marginTop: 0 }}>
            Design Tokens Reference
          </h2>

          <div
            style={{
              display: "grid",
              gap: "var(--space-6)",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            }}
          >
            <div>
              <h3
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "18px",
                  marginBottom: "var(--space-3)",
                }}
              >
                Colors
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      background: "var(--color-accent)",
                      borderRadius: "4px",
                    }}
                  ></div>
                  <span style={{ fontSize: "14px" }}>--color-accent</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      background: "var(--color-accent-2)",
                      borderRadius: "4px",
                    }}
                  ></div>
                  <span style={{ fontSize: "14px" }}>--color-accent-2</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      background: "var(--color-page)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "4px",
                    }}
                  ></div>
                  <span style={{ fontSize: "14px" }}>--color-page</span>
                </div>
              </div>
            </div>

            <div>
              <h3
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "18px",
                  marginBottom: "var(--space-3)",
                }}
              >
                Typography
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "var(--h1-mobile)",
                  }}
                >
                  Playfair Display
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--card-title-mobile)",
                  }}
                >
                  Inter Sans
                </div>
                <div
                  style={{
                    fontSize: "var(--meta)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Meta text (14px)
                </div>
              </div>
            </div>

            <div>
              <h3
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "18px",
                  marginBottom: "var(--space-3)",
                }}
              >
                Components
              </h3>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  fontSize: "14px",
                  color: "var(--color-text-muted)",
                }}
              >
                <li>.hw-card - Story card</li>
                <li>.hw-card-media - Image aspect ratio</li>
                <li>.hw-play - Play button</li>
                <li>.hw-meta - Metadata row</li>
                <li>.hw-spine - Timeline spine</li>
                <li>.hw-node - Timeline node</li>
                <li>.hw-decade - Decade header</li>
                <li>.hw-grid - Responsive grid</li>
              </ul>
            </div>
          </div>

          <div
            style={{
              marginTop: "var(--space-6)",
              padding: "var(--space-4)",
              background: "var(--color-page)",
              borderRadius: "var(--radius-card)",
            }}
          >
            <h4 style={{ fontSize: "16px", marginBottom: "var(--space-2)" }}>
              Accessibility Features
            </h4>
            <ul
              style={{
                fontSize: "14px",
                lineHeight: "1.6",
                color: "var(--color-text)",
              }}
            >
              <li>✓ Focus-visible outline with --color-focus</li>
              <li>
                ✓ Prefers-reduced-motion support (no hover scale on .hw-play)
              </li>
              <li>✓ Semantic HTML with proper aria-labels</li>
              <li>✓ Minimum touch targets (48px)</li>
              <li>✓ Readable text contrast</li>
            </ul>
          </div>
        </section>
      </main>

      {/* Bottom spacing */}
      <div style={{ height: "var(--space-10)" }}></div>
    </div>
  );
}
