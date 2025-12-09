"use client";

import React, { useState, useRef, useEffect } from "react";
import { SectionHeading, SectionSubheading, Button, Card } from "@/components/landing-v2/UI";
import { IconMic, IconBookOpen, IconHeart, IconShare, IconPlay, IconCheck, IconLock, IconGlobe } from "@/components/landing-v2/Icons";

// --- Placeholder Image Constants ---
// Mapping to actual screenshots from /public folder
const IMAGES = {
  timelineSmall: "/timeline-hero.webp", // Vertical hero image
  timelineFull: "/timeline.webp", // Full scrolling image for feature section
  book: "/book full.webp",
  memoryBox: "/memory-box.webp",
  pocketwatch: "/pocketwatch.png",
  family: "https://picsum.photos/seed/family/1200/800",
  senior: "https://picsum.photos/seed/grandma/200/200",
  logo: "/images/logo.png",
};

const AUDIO = {
  pocketwatch: "/Pocket Watch.mp3",
};

// --- Components for Page Sections ---

const Navbar = () => (
  <nav className="sticky top-0 z-50 w-full bg-cream-100/90 backdrop-blur-sm border-b border-navy-900/5">
    <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <img src="/final logo/logo hw.svg" alt="HeritageWhisper Logo" className="w-10 h-10" />
        <span className="text-2xl font-serif font-bold text-navy-900 tracking-tight">HeritageWhisper</span>
      </div>

      <div className="hidden md:flex items-center gap-8">
        <a href="#how-it-works" className="text-navy-900 font-medium hover:text-green-800 transition-colors">How it works</a>
        <a href="#features" className="text-navy-900 font-medium hover:text-green-800 transition-colors">Features</a>
        <a href="#pricing" className="text-navy-900 font-medium hover:text-green-800 transition-colors">Pricing</a>
      </div>

      <div className="flex items-center gap-4">
        <a href="#" className="hidden md:block text-navy-900 font-medium hover:text-navy-800">Sign In</a>
        <Button variant="primary" size="sm">Start Writing</Button>
      </div>
    </div>
  </nav>
);

const Hero = () => (
  <section className="relative pt-16 pb-24 overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
      <div className="text-center max-w-4xl mx-auto mb-16">
        <span className="inline-block py-1 px-3 rounded-full bg-gold-400/20 text-gold-600 text-sm font-bold tracking-wider uppercase mb-6 border border-gold-400/30">
          The New Standard for Family History
        </span>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-medium text-navy-900 leading-[1.1] mb-8">
          The story of a lifetime.<br />
          <span className="text-green-800 italic">Spoken,</span> not just written.
        </h1>
        <p className="text-xl text-navy-800/80 max-w-2xl mx-auto mb-10 leading-relaxed">
          HeritageWhisper is a living voice archive. Record memories in minutes, and watch them automatically transform into a digital book, timeline, and keepsake box your family can access anywhere.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="primary" size="lg" className="w-full sm:w-auto">Start your first story</Button>
          <Button variant="ghost" size="lg" className="w-full sm:w-auto group">
            See how it works
            <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </Button>
        </div>
      </div>

      {/* Product Gallery Composite */}
      <div className="relative mt-12 max-w-7xl mx-auto">
        {/* Background decorative elements */}
        <div className="absolute -inset-4 bg-gradient-to-b from-cream-200/0 to-cream-200/50 rounded-[3rem] -z-10"></div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">

          {/* Left Card: Timeline (Vertical) */}
          <div className="md:col-span-3 transform translate-y-0 md:translate-y-8 transition-transform hover:-translate-y-2 duration-500 relative group">
            <div className="bg-white p-2 rounded-xl shadow-xl border border-cream-200 h-full">
              <div className="relative overflow-hidden rounded-lg h-[320px] md:h-[420px] bg-cream-50">
                {/* Object-top is crucial here for the long vertical timeline image */}
                <img
                  src={IMAGES.timelineSmall}
                  alt="Timeline Interface"
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/40 pointer-events-none"></div>
              </div>
              <div className="px-3 py-1 absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur shadow-md rounded-lg border border-cream-100">
                <h3 className="font-serif text-navy-900 font-bold text-sm text-center leading-none">The Timeline</h3>
                <p className="text-xs text-navy-800/60 hidden xl:block text-center leading-none">Every story in order</p>
              </div>
            </div>
          </div>

          {/* Center Card: Book View (Landscape/Wide) */}
          <div className="md:col-span-6 z-20 transform transition-transform hover:scale-[1.02] duration-500">
            <div className="bg-white p-3 rounded-2xl shadow-2xl border border-cream-200">
              <div className="relative overflow-hidden rounded-xl bg-cream-50 aspect-[4/3]">
                <img
                  src={IMAGES.book}
                  alt="Book View Interface"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="px-4 py-1.5 text-center border-t border-cream-100 mt-2">
                <h3 className="font-serif text-xl text-navy-900 font-bold leading-tight">The Living Book</h3>
                <p className="text-sm text-navy-800/60 text-center leading-tight">Grows automatically with every memory you share.</p>
              </div>
            </div>
          </div>

          {/* Right Card: Memory Box (Grid) */}
          <div className="md:col-span-3 transform translate-y-0 md:translate-y-8 transition-transform hover:-translate-y-2 duration-500 relative group">
            <div className="bg-white p-2 rounded-xl shadow-xl border border-cream-200 h-full">
              <div className="relative overflow-hidden rounded-lg h-[320px] md:h-[420px] bg-cream-50">
                <img
                  src={IMAGES.memoryBox}
                  alt="Memory Box Interface"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  style={{ objectPosition: 'center 10%' }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-white/40 pointer-events-none"></div>
              </div>
              <div className="px-3 py-1 absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur shadow-md rounded-lg border border-cream-100">
                <h3 className="font-serif text-navy-900 font-bold text-sm text-center leading-none">Memory Box</h3>
                <p className="text-xs text-navy-800/60 hidden xl:block text-center leading-none">Keepsakes & loose photos</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </section>
);

const ComparisonSection = () => (
  <section className="py-20 bg-white border-y border-cream-200">
    <div className="max-w-5xl mx-auto px-4 md:px-8">
      <SectionHeading centered>Why a living legacy?</SectionHeading>
      <SectionSubheading centered className="mb-12">
        Most memoir services rush you to print a single book. But life doesn&apos;t stop when the ink dries.
      </SectionSubheading>

      <div className="grid md:grid-cols-2 gap-8 md:gap-16">
        <div className="p-8 rounded-2xl bg-cream-50 border border-cream-200 opacity-70 hover:opacity-100 transition-opacity">
          <h3 className="font-serif text-2xl text-navy-900/60 mb-4">The Old Way</h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3 text-navy-800/70">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
              <span>Feels like a deadline: &quot;Finish the book by Christmas.&quot;</span>
            </li>
            <li className="flex items-start gap-3 text-navy-800/70">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
              <span>Static text. You lose the sound of their voice.</span>
            </li>
            <li className="flex items-start gap-3 text-navy-800/70">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
              <span>Sits on a shelf. Only one person can read it at a time.</span>
            </li>
          </ul>
        </div>

        <div className="p-8 rounded-2xl bg-green-50 border border-green-100 relative shadow-lg">
          <div className="absolute -top-3 -right-3 bg-green-800 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            RECOMMENDED
          </div>
          <h3 className="font-serif text-2xl text-green-900 mb-4">HeritageWhisper</h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3 text-navy-900">
              <IconCheck className="w-5 h-5 text-green-700 shrink-0" />
              <span><strong>No deadlines.</strong> Add a new story whenever you remember one.</span>
            </li>
            <li className="flex items-start gap-3 text-navy-900">
              <IconCheck className="w-5 h-5 text-green-700 shrink-0" />
              <span><strong>Voice-first.</strong> Capture the laughter, pauses, and tone.</span>
            </li>
            <li className="flex items-start gap-3 text-navy-900">
              <IconCheck className="w-5 h-5 text-green-700 shrink-0" />
              <span><strong>Always accessible.</strong> Family can listen on their phones, miles apart.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
);

const HowItWorks = () => (
  <section id="how-it-works" className="py-24 bg-cream-100">
    <div className="max-w-7xl mx-auto px-4 md:px-8">
      <SectionHeading centered>Preserving memories in 3 simple steps</SectionHeading>

      <div className="grid md:grid-cols-3 gap-8 mt-16">
        {/* Step 1 */}
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-white shadow-md flex items-center justify-center mb-6 text-gold-600 border border-cream-200">
            <IconMic className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-navy-900 mb-3">1. Just Talk</h3>
          <p className="text-navy-800/80 leading-relaxed">
            No typing required. Use our prompts or tell your own story. We record high-quality audio and transcribe it automatically.
          </p>
        </div>

        {/* Step 2 */}
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-white shadow-md flex items-center justify-center mb-6 text-gold-600 border border-cream-200">
            <IconBookOpen className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-navy-900 mb-3">2. See & Organize</h3>
          <p className="text-navy-800/80 leading-relaxed">
            Stories instantly appear in your digital <strong>Book</strong> and <strong>Timeline</strong>. Add photos to the <strong>Memory Box</strong> to bring them to life.
          </p>
        </div>

        {/* Step 3 */}
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-white shadow-md flex items-center justify-center mb-6 text-gold-600 border border-cream-200">
            <IconShare className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-navy-900 mb-3">3. Family Listens</h3>
          <p className="text-navy-800/80 leading-relaxed">
            Invite family via email. They get notified of new stories and can listen from anywhere—no app download required.
          </p>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-navy-800/60 bg-white/50 inline-block px-4 py-2 rounded-full border border-navy-900/5">
          Prefer typing? You can write stories directly or edit transcripts anytime.
        </p>
      </div>
    </div>
  </section>
);

const AudioDemo = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <section className="py-24 bg-navy-900 text-cream-100 overflow-hidden relative">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "30px 30px" }}>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="text-gold-500 font-bold tracking-wider uppercase text-sm mb-4 block">The Power of Voice</span>
          <h2 className="text-3xl md:text-5xl font-serif font-medium mb-6 text-white">
            Text captures the facts.<br />Voice captures the soul.
          </h2>
          <p className="text-lg text-cream-200/80 leading-relaxed mb-8">
            When you read &quot;I was happy,&quot; you know the fact. When you <em>hear</em> the chuckle in Dad&apos;s voice as he tells the story, you feel the moment.
          </p>
          <p className="text-lg text-cream-200/80 leading-relaxed mb-8">
            HeritageWhisper is built to capture the accents, the pauses, and the laughter that text alone leaves out.
          </p>
        </div>

        {/* Audio Player Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 md:p-8 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <img src={IMAGES.pocketwatch} alt="Pocket Watch" className="w-16 h-16 rounded-full object-cover border-2 border-gold-500" />
            <div>
              <h4 className="text-white font-serif text-xl">Frozen at 3:17</h4>
              <p className="text-cream-200/60 text-sm">A cherished memory</p>
            </div>
          </div>

          {/* Waveform Visualization */}
          <div className="h-16 flex items-center gap-1 mb-6 justify-center opacity-80">
            {[...Array(40)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-gold-400 rounded-full animate-pulse"
                style={{
                  height: `${Math.max(20, Math.random() * 100)}%`,
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="w-12 h-12 bg-gold-500 rounded-full flex items-center justify-center text-navy-900 hover:bg-gold-400 transition-colors"
            >
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <IconPlay className="w-5 h-5 fill-current" />
              )}
            </button>
            <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-gold-500 transition-all duration-200" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="text-xs font-mono text-gold-400">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Hidden audio element */}
          <audio ref={audioRef} src={AUDIO.pocketwatch} preload="metadata" />
        </div>
      </div>
    </section>
  );
};

const DistributedAccess = () => (
  <section className="py-24 bg-white">
    <div className="max-w-5xl mx-auto px-4 md:px-8 text-center">
      <div className="w-16 h-16 bg-green-100 text-green-800 rounded-full flex items-center justify-center mx-auto mb-6">
        <IconGlobe className="w-8 h-8" />
      </div>
      <SectionHeading>No QR codes. No waiting for the mail.</SectionHeading>
      <SectionSubheading className="mx-auto mb-12">
        Printed books are wonderful, but they live in one house. HeritageWhisper brings the family together, even when you&apos;re miles apart.
      </SectionSubheading>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-cream-50 border-none">
          <h4 className="font-bold text-navy-900 mb-2 text-center">Grandma in Florida</h4>
          <p className="text-sm text-navy-800/70 text-center">Records a story about her wedding day while having morning coffee.</p>
        </Card>
        <Card className="bg-cream-50 border-none">
          <h4 className="font-bold text-navy-900 mb-2 text-center">Instant Update</h4>
          <p className="text-sm text-navy-800/70 text-center">The story is securely saved and added to the family timeline immediately.</p>
        </Card>
        <Card className="bg-cream-50 border-none">
          <h4 className="font-bold text-navy-900 mb-2 text-center">You in New York</h4>
          <p className="text-sm text-navy-800/70 text-center">Get an email notification and listen to her voice on your commute.</p>
        </Card>
      </div>
    </div>
  </section>
);

// Auto-scrolling Timeline Component
const ScrollingTimeline = ({ src, alt }: { src: string; alt: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const scrollDirectionRef = useRef<"down" | "up">("down");
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollSpeed = 0.5; // pixels per frame

    const autoScroll = () => {
      if (!isUserScrollingRef.current && container) {
        const maxScroll = container.scrollHeight - container.clientHeight;
        const currentScroll = container.scrollTop;

        if (scrollDirectionRef.current === "down") {
          if (currentScroll >= maxScroll - 1) {
            scrollDirectionRef.current = "up";
          } else {
            container.scrollTop += scrollSpeed;
          }
        } else {
          if (currentScroll <= 1) {
            scrollDirectionRef.current = "down";
          } else {
            container.scrollTop -= scrollSpeed;
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(autoScroll);
    };

    // Start auto-scrolling
    animationFrameRef.current = requestAnimationFrame(autoScroll);

    // Handle user interaction
    const handleUserInteraction = () => {
      isUserScrollingRef.current = true;

      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }

      userScrollTimeoutRef.current = setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 2000);
    };

    container.addEventListener("wheel", handleUserInteraction);
    container.addEventListener("touchstart", handleUserInteraction);
    container.addEventListener("mousedown", handleUserInteraction);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
      container.removeEventListener("wheel", handleUserInteraction);
      container.removeEventListener("touchstart", handleUserInteraction);
      container.removeEventListener("mousedown", handleUserInteraction);
    };
  }, []);

  return (
    <div className="relative rounded-xl overflow-hidden shadow-xl border border-cream-200/50">
      {/* Top fade gradient */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white via-white/80 to-transparent z-10 pointer-events-none"></div>

      {/* Scrolling container - reduced height */}
      <div
        ref={containerRef}
        className="h-[320px] overflow-y-auto bg-white"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#EBE2D5 transparent",
        }}
      >
        <img src={src} alt={alt} className="w-full h-auto" />
      </div>

      {/* Bottom fade gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none"></div>
    </div>
  );
};

// Features data defined outside component to prevent recreation
const FEATURES_DATA = [
  {
    tabName: "Live Timeline",
    title: "The Timeline",
    desc: "Life isn't a list of dates, but seeing it laid out is magic. Our Timeline view automatically organizes stories by the date they happened, giving you a bird's-eye view of the family legacy.",
    image: IMAGES.timelineFull,
    imgAlt: "Timeline View Screenshot",
    isScrolling: true,
  },
  {
    tabName: "Living Book",
    title: "The Living Book",
    desc: "Experience stories in a beautiful, distraction-free reader. It feels like a professionally published memoir, but you can add a new chapter whenever inspiration strikes. No 'final draft' anxiety.",
    image: IMAGES.book,
    imgAlt: "Digital Book Screenshot",
    isScrolling: false,
  },
  {
    tabName: "Memory Box",
    title: "The Memory Box",
    desc: "Not every memory has a date. The Memory Box is the home for loose photos, recipes, audio clips, and mementos that add texture to the family history without needing a specific place on the timeline.",
    image: IMAGES.memoryBox,
    imgAlt: "Memory Box Grid Screenshot",
    isScrolling: true,
  },
];

const FeatureDeepDive = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const autoRotateRef = useRef<NodeJS.Timeout | null>(null);
  const AUTO_ROTATE_INTERVAL = 6000; // 6 seconds per tab
  const TOTAL_TABS = 3;

  // Auto-rotate tabs
  useEffect(() => {
    const rotateTab = () => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveTab((prev) => (prev + 1) % TOTAL_TABS);
        setIsTransitioning(false);
      }, 300);
    };

    autoRotateRef.current = setInterval(rotateTab, AUTO_ROTATE_INTERVAL);

    return () => {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current);
      }
    };
  }, []);

  // Reset auto-rotate timer when user manually clicks a tab
  const handleTabClick = (index: number) => {
    if (index === activeTab || isTransitioning) return;

    // Clear existing timer
    if (autoRotateRef.current) {
      clearInterval(autoRotateRef.current);
    }

    // Transition to new tab
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(index);
      setIsTransitioning(false);
    }, 300);

    // Restart auto-rotate after user interaction
    autoRotateRef.current = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveTab((prev) => (prev + 1) % TOTAL_TABS);
        setIsTransitioning(false);
      }, 300);
    }, AUTO_ROTATE_INTERVAL);
  };

  const currentFeature = FEATURES_DATA[activeTab];

  return (
    <section id="features" className="py-24 bg-cream-100">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-white rounded-full p-1.5 shadow-lg border border-cream-200">
            {FEATURES_DATA.map((f, i) => (
              <button
                key={i}
                onClick={() => handleTabClick(i)}
                className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${
                  activeTab === i
                    ? "bg-green-800 text-white shadow-md"
                    : "text-navy-800 hover:text-green-800 hover:bg-cream-50"
                }`}
              >
                {f.tabName}
              </button>
            ))}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {FEATURES_DATA.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${
                activeTab === i ? "w-8 bg-green-800" : "w-2 bg-cream-300"
              }`}
            />
          ))}
        </div>

        {/* Content Area - Compact */}
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Image with fade transition */}
          <div className="flex-1 w-full max-w-md">
            <div
              className={`transition-opacity duration-300 ${
                isTransitioning ? "opacity-0" : "opacity-100"
              }`}
            >
              {currentFeature.isScrolling ? (
                <ScrollingTimeline
                  key={activeTab}
                  src={currentFeature.image}
                  alt={currentFeature.imgAlt}
                />
              ) : (
                <div className="relative rounded-xl overflow-hidden shadow-xl border border-cream-200/50">
                  <img
                    src={currentFeature.image}
                    alt={currentFeature.imgAlt}
                    className="w-full h-auto max-h-[320px] object-contain bg-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Text content with fade transition */}
          <div
            className={`flex-1 space-y-4 transition-opacity duration-300 ${
              isTransitioning ? "opacity-0" : "opacity-100"
            }`}
          >
            <h3 className="text-2xl md:text-3xl font-serif font-medium text-navy-900">
              {currentFeature.title}
            </h3>
            <div className="w-10 h-1 bg-gold-500"></div>
            <p className="text-base text-navy-800/80 leading-relaxed">
              {currentFeature.desc}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const Pricing = () => (
  <section id="pricing" className="py-24 bg-white">
    <div className="max-w-3xl mx-auto px-4 md:px-8 text-center">
      <SectionHeading centered>Simple, transparent pricing</SectionHeading>
      <p className="text-lg text-navy-800/60 mb-12">No credit card required for the first 3 stories.</p>

      <div className="relative bg-white rounded-3xl shadow-2xl border border-cream-200 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-700 to-green-900"></div>
        <div className="p-10 md:p-12">
          <h3 className="text-2xl font-serif font-bold text-navy-900">The Family Legacy Plan</h3>
          <div className="my-6 flex items-baseline justify-center gap-1">
            <span className="text-5xl font-bold text-navy-900">$99</span>
            <span className="text-navy-800/60">/ year</span>
          </div>
          <p className="text-navy-800/70 mb-8 max-w-sm mx-auto">
            Includes unlimited storage for audio, photos, and text. Invite unlimited family members to listen and contribute.
          </p>

          <Button variant="primary" size="lg" className="w-full md:w-2/3 mb-6">Start your first story (Free)</Button>
          <p className="text-xs text-navy-800/50 mb-8">No credit card required for the first 3 stories.</p>

          <div className="border-t border-cream-200 pt-8">
            <ul className="text-left space-y-4 max-w-md mx-auto">
              <li className="flex items-center gap-3 text-navy-900/80">
                <IconCheck className="w-5 h-5 text-green-800" />
                <span>Unlimited voice recording &amp; transcription</span>
              </li>
              <li className="flex items-center gap-3 text-navy-900/80">
                <IconCheck className="w-5 h-5 text-green-800" />
                <span>Timeline, Book, and Memory Box views</span>
              </li>
              <li className="flex items-center gap-3 text-navy-900/80">
                <IconCheck className="w-5 h-5 text-green-800" />
                <span>Family sharing &amp; email notifications</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="bg-cream-50 p-4 text-center border-t border-cream-200 flex justify-center items-center gap-2 text-sm text-navy-800/60">
          <IconLock className="w-4 h-4" />
          <span>Private &amp; Secure. Your data is never sold.</span>
        </div>
      </div>
    </div>
  </section>
);

const Testimonials = () => (
  <section className="py-24 bg-cream-100 border-t border-cream-200">
    <div className="max-w-7xl mx-auto px-4 md:px-8">
      <SectionHeading centered>Families love HeritageWhisper</SectionHeading>
      <div className="grid md:grid-cols-3 gap-8 mt-12">

        <Card className="bg-white relative">
          <div className="absolute -top-4 -left-2 text-6xl text-gold-200 font-serif">&quot;</div>
          <p className="text-navy-800/80 italic mb-6 relative z-10">
            I tried getting my dad to write in a journal, but he never did it. With this, he just talks into his phone for 5 minutes a week. We have over 40 stories now.
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center font-bold text-navy-900">S</div>
            <div>
              <h5 className="font-bold text-navy-900 text-sm">Sarah J.</h5>
              <p className="text-xs text-navy-800/50">Daughter</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white relative">
          <div className="absolute -top-4 -left-2 text-6xl text-gold-200 font-serif">&quot;</div>
          <p className="text-navy-800/80 italic mb-6 relative z-10">
            It&apos;s so simple. I don&apos;t have to log into a complicated website. I just click the link in my email and I&apos;m listening to my grandfather&apos;s voice.
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center font-bold text-navy-900">M</div>
            <div>
              <h5 className="font-bold text-navy-900 text-sm">Mike T.</h5>
              <p className="text-xs text-navy-800/50">Grandson</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white relative">
          <div className="absolute -top-4 -left-2 text-6xl text-gold-200 font-serif">&quot;</div>
          <p className="text-navy-800/80 italic mb-6 relative z-10">
            I was worried it would be too &apos;techy&apos; for me, but the recording is very clear. It feels good to know these stories are safe.
          </p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center font-bold text-navy-900">E</div>
            <div>
              <h5 className="font-bold text-navy-900 text-sm">Eleanor R.</h5>
              <p className="text-xs text-navy-800/50">Storyteller (Age 74)</p>
            </div>
          </div>
        </Card>

      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-navy-900 text-cream-200 py-16">
    <div className="max-w-7xl mx-auto px-4 md:px-8 grid md:grid-cols-4 gap-12">
      <div className="col-span-1 md:col-span-2">
        <div className="flex items-center gap-2 mb-6">
          <img src="/final logo/logo hw.svg" alt="HeritageWhisper Logo" className="w-8 h-8 brightness-0 invert" />
          <span className="text-2xl font-serif font-bold text-white">HeritageWhisper</span>
        </div>
        <p className="max-w-sm text-cream-200/60 leading-relaxed mb-8">
          Building the world&apos;s most cherished living library of family stories. Future-proof, voice-first, and designed for generations.
        </p>
        <Button variant="primary" size="md">Start your first story</Button>
      </div>

      <div>
        <h4 className="font-bold text-white mb-6 uppercase text-sm tracking-wider">Product</h4>
        <ul className="space-y-3 text-sm text-cream-200/70">
          <li><a href="#" className="hover:text-white transition-colors">Timeline</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Memory Box</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Gift Subscriptions</a></li>
        </ul>
      </div>

      <div>
        <h4 className="font-bold text-white mb-6 uppercase text-sm tracking-wider">Support</h4>
        <ul className="space-y-3 text-sm text-cream-200/70">
          <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
          <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 md:px-8 mt-16 pt-8 border-t border-white/10 text-center text-xs text-cream-200/40">
      &copy; {new Date().getFullYear()} HeritageWhisper Inc. All rights reserved.
    </div>
  </footer>
);

// --- Main App Layout ---

export default function LandingV2() {
  return (
    <div className="min-h-screen flex flex-col font-sans text-navy-900 bg-cream-100 selection:bg-gold-400/30">
      <main className="flex-grow">
        <Hero />
        <ComparisonSection />
        <HowItWorks />
        <AudioDemo />
        <DistributedAccess />
        <FeatureDeepDive />
        <Pricing />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}
