"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Prevent static generation for this admin page
export const dynamic = 'force-dynamic';

export default function NorthStarPage() {
  const { user } = useAuth();
  const navLinksRef = useRef<HTMLAnchorElement[]>([]);

  useEffect(() => {
    // Smooth scrolling for navigation links
    const handleNavClick = (e: MouseEvent) => {
      e.preventDefault();
      const link = e.currentTarget as HTMLAnchorElement;
      const targetId = link.getAttribute("href");
      if (targetId) {
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
          const offsetTop = (targetSection as HTMLElement).offsetTop - 80;
          window.scrollTo({
            top: offsetTop,
            behavior: "smooth",
          });
        }
      }
    };

    navLinksRef.current.forEach((link) => {
      link?.addEventListener("click", handleNavClick as EventListener);
    });

    // Highlight active nav link on scroll
    const handleScroll = () => {
      const sections = document.querySelectorAll("section[id]");
      const navLinks = navLinksRef.current;

      let currentSection = "";
      sections.forEach((section) => {
        const sectionTop = (section as HTMLElement).offsetTop - 100;
        if (window.scrollY >= sectionTop) {
          currentSection = section.getAttribute("id") || "";
        }
      });

      navLinks.forEach((link) => {
        if (link) {
          link.style.backgroundColor = "transparent";
          link.style.color = "var(--color-text)";
          if (link.getAttribute("href") === "#" + currentSection) {
            link.style.backgroundColor = "var(--hw-coral-bg)";
            link.style.color = "var(--hw-coral)";
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      navLinksRef.current.forEach((link) => {
        link?.removeEventListener("click", handleNavClick as EventListener);
      });
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (!user) {
    return (
      <div className="hw-page flex items-center justify-center p-4 bg-[#FFF8F3]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Please sign in to access this page</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');

        :root {
          /* Primitive Color Tokens */
          --color-white: rgba(255, 255, 255, 1);
          --color-black: rgba(0, 0, 0, 1);
          --color-cream-50: rgba(252, 252, 249, 1);
          --color-cream-100: rgba(255, 255, 253, 1);
          --color-gray-200: rgba(245, 245, 245, 1);
          --color-gray-300: rgba(167, 169, 169, 1);
          --color-gray-400: rgba(119, 124, 124, 1);
          --color-slate-500: rgba(98, 108, 113, 1);
          --color-brown-600: rgba(94, 82, 64, 1);
          --color-charcoal-700: rgba(31, 33, 33, 1);
          --color-charcoal-800: rgba(38, 40, 40, 1);
          --color-slate-900: rgba(19, 52, 59, 1);
          --color-teal-300: rgba(50, 184, 198, 1);
          --color-teal-400: rgba(45, 166, 178, 1);
          --color-teal-500: rgba(33, 128, 141, 1);
          --color-teal-600: rgba(29, 116, 128, 1);
          --color-teal-700: rgba(26, 104, 115, 1);
          --color-teal-800: rgba(41, 150, 161, 1);
          --color-red-400: rgba(255, 84, 89, 1);
          --color-red-500: rgba(192, 21, 47, 1);
          --color-orange-400: rgba(230, 129, 97, 1);
          --color-orange-500: rgba(168, 75, 47, 1);

          /* RGB versions for opacity control */
          --color-brown-600-rgb: 94, 82, 64;
          --color-teal-500-rgb: 33, 128, 141;
          --color-slate-900-rgb: 19, 52, 59;
          --color-slate-500-rgb: 98, 108, 113;
          --color-red-500-rgb: 192, 21, 47;
          --color-red-400-rgb: 255, 84, 89;
          --color-orange-500-rgb: 168, 75, 47;
          --color-orange-400-rgb: 230, 129, 97;

          /* Background color tokens (Light Mode) */
          --color-bg-1: rgba(59, 130, 246, 0.08);
          --color-bg-2: rgba(245, 158, 11, 0.08);
          --color-bg-3: rgba(34, 197, 94, 0.08);
          --color-bg-4: rgba(239, 68, 68, 0.08);
          --color-bg-5: rgba(147, 51, 234, 0.08);
          --color-bg-6: rgba(249, 115, 22, 0.08);
          --color-bg-7: rgba(236, 72, 153, 0.08);
          --color-bg-8: rgba(6, 182, 212, 0.08);

          /* Semantic Color Tokens (Light Mode) - aligned with site theme */
          --color-background: #FDF6F0;
          --color-surface: #FFFFFF;
          --color-text: hsl(210, 10%, 23%);
          --color-text-secondary: hsl(45, 5%, 55%);
          --color-primary: hsl(0, 77%, 64%);
          --color-primary-hover: hsl(0, 77%, 58%);
          --color-primary-active: hsl(0, 77%, 50%);
          --color-secondary: rgba(212, 133, 58, 0.12);
          --color-secondary-hover: rgba(212, 133, 58, 0.2);
          --color-secondary-active: rgba(212, 133, 58, 0.25);
          --color-border: hsl(45, 20%, 82%);
          --color-btn-primary-text: #FFFFFF;
          --color-card-border: hsl(45, 20%, 82%);
          --color-card-border-inner: hsl(45, 20%, 88%);
          --color-error: hsl(356, 90%, 54%);
          --color-success: hsl(145, 45%, 40%);
          --color-warning: #fbbf24;
          --color-info: hsl(210, 10%, 40%);
          --color-focus-ring: rgba(232, 93, 93, 0.4);
          --color-select-caret: rgba(31, 33, 33, 0.8);

          /* HeritageWhisper Brand Colors - aligned with site */
          --hw-coral: #E85D5D;
          --hw-coral-light: #F08A8A;
          --hw-coral-bg: rgba(232, 93, 93, 0.10);
          --hw-cream: #FDF6F0;
          --hw-cream-dark: #F5EFE7;
          --hw-orange: #D4853A;
          --hw-orange-light: #E6A15E;
          --hw-orange-bg: rgba(212, 133, 58, 0.10);

          /* Typography */
          --font-family-base: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          --font-family-mono: "Berkeley Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          --font-size-xs: 11px;
          --font-size-sm: 12px;
          --font-size-base: 14px;
          --font-size-md: 14px;
          --font-size-lg: 16px;
          --font-size-xl: 18px;
          --font-size-2xl: 20px;
          --font-size-3xl: 24px;
          --font-size-4xl: 30px;
          --font-size-5xl: 36px;
          --font-size-6xl: 48px;
          --font-weight-normal: 400;
          --font-weight-medium: 500;
          --font-weight-semibold: 550;
          --font-weight-bold: 600;
          --line-height-tight: 1.2;
          --line-height-normal: 1.5;
          --letter-spacing-tight: -0.01em;

          /* Spacing */
          --space-0: 0;
          --space-1: 1px;
          --space-2: 2px;
          --space-4: 4px;
          --space-6: 6px;
          --space-8: 8px;
          --space-10: 10px;
          --space-12: 12px;
          --space-16: 16px;
          --space-20: 20px;
          --space-24: 24px;
          --space-32: 32px;
          --space-40: 40px;
          --space-48: 48px;
          --space-64: 64px;

          /* Border Radius */
          --radius-sm: 6px;
          --radius-base: 8px;
          --radius-md: 10px;
          --radius-lg: 12px;
          --radius-xl: 16px;
          --radius-full: 9999px;

          /* Shadows */
          --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.02);
          --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
          --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
          --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.02);

          /* Animation */
          --duration-fast: 150ms;
          --duration-normal: 250ms;
          --ease-standard: cubic-bezier(0.16, 1, 0.3, 1);
        }

        .north-star-page * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .north-star-page {
          font-family: var(--font-family-base);
          background-color: var(--hw-cream);
          color: var(--color-text);
          line-height: var(--line-height-normal);
          font-size: var(--font-size-base);
        }

        /* Navigation */
        .ns-nav {
          position: sticky;
          top: 0;
          background: var(--color-white);
          border-bottom: 1px solid var(--color-card-border);
          z-index: 1000;
          padding: var(--space-16) 0;
        }

        .ns-nav-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 var(--space-24);
        }

        .ns-nav-brand {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          color: var(--hw-coral);
        }

        .ns-nav-links {
          display: flex;
          gap: var(--space-32);
          list-style: none;
        }

        .ns-nav-link {
          color: var(--color-text);
          text-decoration: none;
          font-weight: var(--font-weight-medium);
          font-size: var(--font-size-sm);
          transition: color var(--duration-fast) var(--ease-standard);
          padding: var(--space-8) var(--space-12);
          border-radius: var(--radius-base);
        }

        .ns-nav-link:hover {
          color: var(--hw-coral);
          background-color: var(--hw-coral-bg);
        }

        /* Print Button */
        .ns-print-btn {
          background: var(--hw-coral);
          color: white;
          border: none;
          padding: var(--space-8) var(--space-16);
          border-radius: var(--radius-base);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: background-color var(--duration-fast) var(--ease-standard);
        }

        .ns-print-btn:hover {
          background: var(--hw-coral-light);
        }

        /* Container */
        .ns-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 var(--space-24);
        }

        /* Sections */
        .ns-section {
          padding: var(--space-64) 0;
        }

        .ns-section-title {
          font-size: var(--font-size-4xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text);
          margin-bottom: var(--space-48);
          text-align: center;
          font-family: 'Playfair Display', Georgia, serif;
        }

        .ns-section-subtitle {
          font-size: var(--font-size-xl);
          color: var(--color-text-secondary);
          text-align: center;
          margin-bottom: var(--space-32);
        }

        /* Hero Section */
        .ns-hero {
          text-align: center;
          padding: var(--space-64) 0 var(--space-48);
        }

        .ns-hero-title {
          font-size: var(--font-size-6xl);
          font-weight: var(--font-weight-bold);
          color: var(--hw-coral);
          margin-bottom: var(--space-16);
          line-height: var(--line-height-tight);
          font-family: 'Playfair Display', Georgia, serif;
        }

        .ns-hero-subtitle {
          font-size: var(--font-size-2xl);
          color: var(--color-text-secondary);
          margin-bottom: var(--space-48);
        }

        .ns-mission-box {
          background: var(--hw-orange-bg);
          border: 2px solid var(--hw-orange);
          border-radius: var(--radius-xl);
          padding: var(--space-32);
          margin-bottom: var(--space-48);
        }

        .ns-mission-text {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text);
          text-align: center;
        }

        .ns-hero-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--space-32);
          margin-top: var(--space-48);
        }

        /* Cards */
        .ns-card {
          background: var(--color-white);
          border: 1px solid var(--color-card-border);
          border-radius: var(--radius-lg);
          padding: var(--space-24);
          box-shadow: var(--shadow-sm);
          transition: box-shadow var(--duration-normal) var(--ease-standard);
        }

        .ns-card:hover {
          box-shadow: var(--shadow-md);
        }

        .ns-card-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          margin-bottom: var(--space-12);
          color: var(--hw-coral);
          font-family: 'Playfair Display', Georgia, serif;
        }

        .ns-card-subtitle {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin-bottom: var(--space-8);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ns-card-content {
          font-size: var(--font-size-base);
          line-height: var(--line-height-normal);
        }

        /* Grid Layouts */
        .ns-grid-2 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: var(--space-32);
        }

        .ns-grid-3 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--space-24);
        }

        .ns-grid-4 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-20);
        }

        /* Message Cards */
        .ns-tier-1-card {
          background: var(--hw-coral-bg);
          border: 2px solid var(--hw-coral);
        }

        .ns-tier-2-card {
          background: var(--hw-orange-bg);
          border: 2px solid var(--hw-orange);
        }

        .ns-message-section {
          margin-bottom: var(--space-40);
        }

        .ns-message-header {
          background: var(--hw-coral);
          color: white;
          padding: var(--space-12) var(--space-20);
          border-radius: var(--radius-base) var(--radius-base) 0 0;
          margin: calc(-1 * var(--space-24)) calc(-1 * var(--space-24)) var(--space-16) calc(-1 * var(--space-24));
        }

        .ns-tier-2-card .ns-message-header {
          background: var(--hw-orange);
        }

        .ns-message-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
          margin-bottom: var(--space-8);
          font-family: 'Playfair Display', Georgia, serif;
        }

        .ns-message-item {
          margin-bottom: var(--space-12);
        }

        .ns-message-label {
          font-weight: var(--font-weight-semibold);
          color: var(--color-text);
          font-size: var(--font-size-sm);
        }

        .ns-message-text {
          margin-top: var(--space-4);
          font-style: italic;
          color: var(--color-text-secondary);
        }

        /* Comparison Table */
        .ns-comparison-table {
          background: var(--color-white);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          margin-bottom: var(--space-32);
        }

        .ns-table-header {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: var(--hw-coral);
          color: white;
        }

        .ns-table-cell {
          padding: var(--space-16);
          text-align: center;
          font-weight: var(--font-weight-semibold);
        }

        .ns-table-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid var(--color-card-border);
        }

        .ns-table-row:last-child {
          border-bottom: none;
        }

        .ns-table-row .ns-table-cell {
          padding: var(--space-12);
          border-right: 1px solid var(--color-card-border);
        }

        .ns-table-row .ns-table-cell:last-child {
          border-right: none;
        }

        /* Timeline */
        .ns-timeline {
          position: relative;
        }

        .ns-timeline::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          width: 2px;
          height: 100%;
          background: var(--hw-coral);
          transform: translateX(-50%);
        }

        .ns-timeline-item {
          position: relative;
          margin-bottom: var(--space-32);
        }

        .ns-timeline-content {
          width: 45%;
          padding: var(--space-20);
          background: var(--color-white);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
        }

        .ns-timeline-item:nth-child(odd) .ns-timeline-content {
          margin-left: 55%;
        }

        .ns-timeline-item:nth-child(even) .ns-timeline-content {
          margin-right: 55%;
          margin-left: 0;
        }

        .ns-timeline-marker {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 16px;
          height: 16px;
          background: var(--hw-coral);
          border: 4px solid var(--color-white);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          z-index: 2;
        }

        /* Feature Lists */
        .ns-feature-list {
          list-style: none;
          margin: 0;
        }

        .ns-feature-item {
          display: flex;
          align-items: center;
          padding: var(--space-8) 0;
          border-bottom: 1px solid var(--color-card-border);
        }

        .ns-feature-item:last-child {
          border-bottom: none;
        }

        .ns-feature-check {
          color: var(--color-success);
          margin-right: var(--space-12);
          font-weight: var(--font-weight-bold);
        }

        /* Lexicon */
        .ns-lexicon {
          background: var(--color-white);
          border: 1px solid var(--color-card-border);
          border-radius: var(--radius-lg);
          padding: var(--space-24);
        }

        .ns-lexicon-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-bold);
          margin-bottom: var(--space-16);
          text-align: center;
        }

        .ns-lexicon-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-8) 0;
          border-bottom: 1px solid var(--color-card-border);
        }

        .ns-lexicon-item:last-child {
          border-bottom: none;
        }

        .ns-lexicon-wrong {
          color: var(--color-error);
          text-decoration: line-through;
        }

        .ns-lexicon-right {
          color: var(--color-success);
          font-weight: var(--font-weight-medium);
        }

        /* Footer */
        .ns-footer {
          background: var(--color-text);
          color: var(--color-white);
          text-align: center;
          padding: var(--space-32) 0;
        }

        .ns-footer-brand {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          margin-bottom: var(--space-8);
          font-family: 'Playfair Display', Georgia, serif;
        }

        .ns-footer-meta {
          font-size: var(--font-size-sm);
          color: rgba(255, 255, 255, 0.7);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .ns-nav-links {
            display: none;
          }

          .ns-hero-title {
            font-size: var(--font-size-4xl);
          }

          .ns-grid-2,
          .ns-grid-3,
          .ns-grid-4 {
            grid-template-columns: 1fr;
          }

          .ns-timeline::before {
            left: 20px;
          }

          .ns-timeline-content {
            width: calc(100% - 60px);
            margin-left: 60px !important;
            margin-right: 0 !important;
          }

          .ns-timeline-marker {
            left: 20px;
          }
        }

        /* Print Styles */
        @media print {
          .ns-nav,
          .ns-print-btn {
            display: none;
          }

          .ns-section {
            page-break-inside: avoid;
            padding: var(--space-24) 0;
          }

          .north-star-page {
            font-size: 12px;
          }
        }
      `}</style>

      <div className="north-star-page">
        {/* Navigation */}
        <nav className="ns-nav">
          <div className="ns-nav-container">
            <div className="ns-nav-brand">HeritageWhisper</div>
            <ul className="ns-nav-links">
              <li>
                <a href="#mission" className="ns-nav-link" ref={(el) => { if (el) navLinksRef.current[0] = el; }}>
                  Mission &amp; Core
                </a>
              </li>
              <li>
                <a href="#position" className="ns-nav-link" ref={(el) => { if (el) navLinksRef.current[1] = el; }}>
                  Market Position
                </a>
              </li>
              <li>
                <a href="#messaging" className="ns-nav-link" ref={(el) => { if (el) navLinksRef.current[2] = el; }}>
                  Messaging Tiers
                </a>
              </li>
              <li>
                <a href="#competitive" className="ns-nav-link" ref={(el) => { if (el) navLinksRef.current[3] = el; }}>
                  Competitive Edge
                </a>
              </li>
              <li>
                <a href="#launch" className="ns-nav-link" ref={(el) => { if (el) navLinksRef.current[4] = el; }}>
                  Launch Strategy
                </a>
              </li>
              <li>
                <a href="#roadmap" className="ns-nav-link" ref={(el) => { if (el) navLinksRef.current[5] = el; }}>
                  Product Roadmap
                </a>
              </li>
            </ul>
            <button className="ns-print-btn" onClick={() => window.print()}>
              Print
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <section id="mission" className="ns-section ns-hero">
          <div className="ns-container">
            <h1 className="ns-hero-title">HeritageWhisper Positioning Dashboard</h1>
            <p className="ns-hero-subtitle">Your North Star for Strategy, Messaging &amp; Growth</p>

            <div className="ns-mission-box">
              <p className="ns-mission-text">
                We capture wisdom before it&apos;s gone. Every story becomes a lesson your family can replay forever.
              </p>
            </div>

            <div className="ns-hero-grid">
              <div className="ns-card">
                <h3 className="ns-card-title">Elevator Pitch</h3>
                <p className="ns-card-content">
                  HeritageWhisper captures wisdom, not just memories. Press record, tell a 2-minute story, and our story
                  system asks one meaningful follow-up to extract the lesson learned. Every insight lives in the
                  cloud—accessible on every family member&apos;s phone, growing with each recording, never gathering dust on a
                  shelf.
                </p>
              </div>

              <div className="ns-card">
                <h3 className="ns-card-title">Core Promise</h3>
                <p className="ns-card-content">
                  You talk for two minutes. Our story system transcribes, tidies, and asks the next best question.
                </p>
              </div>

              <div className="ns-card">
                <h3 className="ns-card-title">Target Audience</h3>
                <div className="ns-card-content">
                  <p>
                    <strong>Buyer:</strong> Adult child (30-55) who wants an easy, respectful way to capture a parent&apos;s
                    stories
                  </p>
                  <p style={{ marginTop: '12px' }}>
                    <strong>User:</strong> Senior storyteller who needs simplicity, control, and reassurance
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Market Position */}
        <section id="position" className="ns-section">
          <div className="ns-container">
            <h2 className="ns-section-title">How We Win</h2>

            <div className="ns-comparison-table">
              <div className="ns-table-header">
                <div className="ns-table-cell">HeritageWhisper</div>
                <div className="ns-table-cell">Traditional Competitors</div>
              </div>
              <div className="ns-table-row">
                <div className="ns-table-cell">Living digital stories on every phone</div>
                <div className="ns-table-cell">Static books gathering dust</div>
              </div>
              <div className="ns-table-row">
                <div className="ns-table-cell">Extracts wisdom &amp; lessons learned</div>
                <div className="ns-table-cell">Just transcribes memories</div>
              </div>
              <div className="ns-table-row">
                <div className="ns-table-cell">Smartphone-first elegant design</div>
                <div className="ns-table-cell">Archaic, complex interfaces</div>
              </div>
              <div className="ns-table-row">
                <div className="ns-table-cell">Multi-generational family engagement</div>
                <div className="ns-table-cell">One-way senior to book</div>
              </div>
            </div>

            <div className="ns-grid-4">
              <div className="ns-card">
                <div className="ns-card-subtitle">🌟 DIFFERENTIATOR</div>
                <h3 className="ns-card-title">Living Legacy Platform</h3>
                <div className="ns-card-content">
                  <p>
                    <strong>Problem:</strong> Competitors create static annual books that gather dust
                  </p>
                  <p style={{ marginTop: '8px' }}>
                    <strong>Solution:</strong> Continuously updating digital memoir with real-time family notifications
                  </p>
                </div>
              </div>

              <div className="ns-card">
                <div className="ns-card-subtitle">🧠 DIFFERENTIATOR</div>
                <h3 className="ns-card-title">Wisdom Extraction</h3>
                <div className="ns-card-content">
                  <p>
                    <strong>Problem:</strong> Others just transcribe memories
                  </p>
                  <p style={{ marginTop: '8px' }}>
                    <strong>Solution:</strong> AI extracts lessons learned and preserves who they were, not just what
                    happened
                  </p>
                </div>
              </div>

              <div className="ns-card">
                <div className="ns-card-subtitle">📱 DIFFERENTIATOR</div>
                <h3 className="ns-card-title">Smartphone-First UX</h3>
                <div className="ns-card-content">
                  <p>
                    <strong>Problem:</strong> Competitors have archaic, complex interfaces
                  </p>
                  <p style={{ marginTop: '8px' }}>
                    <strong>Solution:</strong> Elegant, intuitive design - if you can FaceTime, you can preserve your
                    legacy
                  </p>
                </div>
              </div>

              <div className="ns-card">
                <div className="ns-card-subtitle">👨‍👩‍👧‍👦 DIFFERENTIATOR</div>
                <h3 className="ns-card-title">Family Engagement Loop</h3>
                <div className="ns-card-content">
                  <p>
                    <strong>Problem:</strong> Traditional platforms are one-way (senior to book)
                  </p>
                  <p style={{ marginTop: '8px' }}>
                    <strong>Solution:</strong> Multi-generational network where family submits questions, gets alerts,
                    creates social proof
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Messaging Tiers */}
        <section id="messaging" className="ns-section">
          <div className="ns-container">
            <h2 className="ns-section-title">Go-To-Market Messaging Framework</h2>

            <div className="ns-message-section">
              <h3 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-24)', color: 'var(--hw-coral)' }}>
                Tier 1: Lead Messages
              </h3>

              <div className="ns-grid-2" style={{ marginBottom: 'var(--space-32)' }}>
                <div className="ns-card ns-tier-1-card">
                  <div className="ns-message-header">
                    <div className="ns-message-title">Stories Your Family Will Actually Listen To</div>
                  </div>
                  <div className="ns-message-item">
                    <div className="ns-message-label">Problem Statement:</div>
                    <div className="ns-message-text">Books sit on shelves. Nobody reads them.</div>
                  </div>
                  <div className="ns-message-item">
                    <div className="ns-message-label">Solution Statement:</div>
                    <div className="ns-message-text">Living digital stories accessible in everyone&apos;s pocket</div>
                  </div>
                  <div className="ns-message-item">
                    <div className="ns-message-label">Marketing Copy:</div>
                    <div className="ns-message-text">
                      &quot;The memoir book nobody will read vs. the living story everyone hears. HeritageWhisper delivers
                      stories where your family already is—on their phones—with updates every time you share something
                      new.&quot;
                    </div>
                  </div>
                  <div className="ns-message-item">
                    <div className="ns-message-label">Why It Works:</div>
                    <div className="ns-message-text">Addresses actual behavior gap</div>
                  </div>
                </div>

                <div className="ns-card ns-tier-1-card">
                  <div className="ns-message-header">
                    <div className="ns-message-title">The AI Wow Moment for Seniors</div>
                  </div>
                  <div className="ns-message-item">
                    <div className="ns-message-label">Problem Statement:</div>
                    <div className="ns-message-text">Seniors haven't experienced good AI and are intimidated</div>
                  </div>
                  <div className="ns-message-item">
                    <div className="ns-message-label">Solution Statement:</div>
                    <div className="ns-message-text">
                      "Story system" gives personalized follow-ups that feel magical
                    </div>
                  </div>
                  <div className="ns-message-item">
                    <div className="ns-message-label">Marketing Copy:</div>
                    <div className="ns-message-text">
                      "Give them their first 'wow' moment with technology. Our story system asks questions only they could
                      answer—pulling out forgotten memories they didn't know they'd share."
                    </div>
                  </div>
                  <div className="ns-message-item">
                    <div className="ns-message-label">Why It Works:</div>
                    <div className="ns-message-text">
                      Adult children understand AI value, want parents to experience it safely
                    </div>
                  </div>
                </div>
              </div>

              <div className="ns-card ns-tier-1-card">
                <div className="ns-message-header">
                  <div className="ns-message-title">Pattern Recognition That Finds Lost Memories</div>
                </div>
                <div className="ns-message-item">
                  <div className="ns-message-label">Problem Statement:</div>
                  <div className="ns-message-text">Generic prompts don't uncover the good stuff</div>
                </div>
                <div className="ns-message-item">
                  <div className="ns-message-label">Solution Statement:</div>
                  <div className="ns-message-text">
                    AI identifies time gaps, people, character traits for personal questions
                  </div>
                </div>
                <div className="ns-message-item">
                  <div className="ns-message-label">Marketing Copy:</div>
                  <div className="ns-message-text">
                    "Not another generic prompt. Questions built from their stories—finding gaps in decades, people
                    they've mentioned, moments they haven't finished telling."
                  </div>
                </div>
                <div className="ns-message-item">
                  <div className="ns-message-label">Why It Works:</div>
                  <div className="ns-message-text">Technical differentiation explained in human terms</div>
                </div>
              </div>
            </div>

            <div className="ns-message-section">
              <h3
                style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-24)', color: 'var(--hw-orange)' }}
              >
                Tier 2: Supporting Messages
              </h3>

              <div className="ns-grid-2">
                <div className="ns-card ns-tier-2-card">
                  <div className="ns-message-header">
                    <div className="ns-message-title">
                      Family Interview Mode{' '}
                      <span style={{ fontSize: 'var(--font-size-sm)', opacity: 0.8 }}>(Coming Soon)</span>
                    </div>
                  </div>
                  <div className="ns-message-item">
                    <div className="ns-message-label">Problem Statement:</div>
                    <div className="ns-message-text">Awkward family interviews, don't know where to start</div>
                  </div>
                  <div className="ns-message-item">
                    <div className="ns-message-label">Solution Statement:</div>
                    <div className="ns-message-text">Guided conversation system</div>
                  </div>
                  <div className="ns-message-item">
                    <div className="ns-message-label">Marketing Copy:</div>
                    <div className="ns-message-text">
                      "Sit down with Dad, press record, and let our story system guide the conversation—capturing decades
                      of wisdom in one afternoon."
                    </div>
                  </div>
                  <div className="ns-message-item">
                    <div className="ns-message-label">Why It Works:</div>
                    <div className="ns-message-text">Category-defining feature</div>
                  </div>
                </div>

                <div className="ns-card ns-tier-2-card">
                  <div className="ns-message-header">
                    <div className="ns-message-title">Wisdom Extraction, Not Memory Collection</div>
                  </div>
                  <div className="ns-message-item">
                    <div className="ns-message-label">Problem Statement:</div>
                    <div className="ns-message-text">Commodity memory capture platforms</div>
                  </div>
                  <div className="ns-message-item">
                    <div className="ns-message-label">Solution Statement:</div>
                    <div className="ns-message-text">Lessons Learned feature</div>
                  </div>
                  <div className="ns-message-item">
                    <div className="ns-message-label">Marketing Copy:</div>
                    <div className="ns-message-text">
                      "Every story becomes a lesson. Our story system finds the wisdom in what they share—preserving not
                      just what happened, but who they became."
                    </div>
                  </div>
                  <div className="ns-message-item">
                    <div className="ns-message-label">Why It Works:</div>
                    <div className="ns-message-text">Differentiates from nostalgia-only platforms</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Competitive Edge */}
        <section id="competitive" className="ns-section">
          <div className="ns-container">
            <h2 className="ns-section-title">Our Moat: Why We'll Win Long-Term</h2>

            <div className="ns-grid-3">
              <div className="ns-card">
                <div className="ns-card-subtitle">🔗 NETWORK EFFECTS</div>
                <h3 className="ns-card-title">Family Engagement Creates Value</h3>
                <p className="ns-card-content">
                  More family engagement increases platform value for storyteller. Each family member who joins creates
                  more reasons for the storyteller to keep sharing.
                </p>
              </div>

              <div className="ns-card">
                <div className="ns-card-subtitle">📊 DATA MOAT</div>
                <h3 className="ns-card-title">Pattern Recognition Improves</h3>
                <p className="ns-card-content">
                  Our story system gets smarter with every story recorded. Pattern recognition for gaps, relationships,
                  and meaningful questions becomes increasingly sophisticated.
                </p>
              </div>

              <div className="ns-card">
                <div className="ns-card-subtitle">💝 EMOTIONAL LOCK-IN</div>
                <h3 className="ns-card-title">Irreplaceable Story Archive</h3>
                <p className="ns-card-content">
                  Years of irreplaceable stories create infinite switching costs. The emotional value of accumulated
                  family history makes migration impossible.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Launch Strategy */}
        <section id="launch" className="ns-section">
          <div className="ns-container">
            <h2 className="ns-section-title">MVP Launch Roadmap</h2>

            <div className="ns-timeline">
              <div className="ns-timeline-item">
                <div className="ns-timeline-marker"></div>
                <div className="ns-timeline-content">
                  <h3 style={{ color: 'var(--hw-coral)', marginBottom: 'var(--space-12)' }}>
                    Phase 1: Beta &amp; Magic Moments
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: 'var(--space-20)' }}>
                    <li>50-100 families</li>
                    <li>Capture video testimonials of "wow moments"</li>
                    <li>First personalized question reactions</li>
                    <li>Auto-generated Lessons Learned</li>
                    <li>Family engagement reactions</li>
                  </ul>
                </div>
              </div>

              <div className="ns-timeline-item">
                <div className="ns-timeline-marker"></div>
                <div className="ns-timeline-content">
                  <h3 style={{ color: 'var(--hw-coral)', marginBottom: 'var(--space-12)' }}>
                    Phase 2: Target Adult Children (30-55)
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: 'var(--space-20)' }}>
                    <li>Facebook/Instagram ads</li>
                    <li>Reddit communities (r/AgingParents, r/Genealogy)</li>
                    <li>Senior living partnerships</li>
                    <li>Messaging: "Preserve stories before it's too late"</li>
                  </ul>
                </div>
              </div>

              <div className="ns-timeline-item">
                <div className="ns-timeline-marker"></div>
                <div className="ns-timeline-content">
                  <h3 style={{ color: 'var(--hw-coral)', marginBottom: 'var(--space-12)' }}>Phase 3: V2 Features</h3>
                  <ul style={{ margin: 0, paddingLeft: 'var(--space-20)' }}>
                    <li>Hold chatbot for revolutionary V2 launch</li>
                    <li>Creates second press moment</li>
                    <li>Audio cleanup features</li>
                    <li>Family tree visualization</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Roadmap */}
        <section id="roadmap" className="ns-section">
          <div className="ns-container">
            <h2 className="ns-section-title">Feature Pipeline</h2>

            <div className="ns-grid-2">
              <div className="ns-card">
                <h3 className="ns-card-title">MVP Features</h3>
                <ul className="ns-feature-list">
                  <li className="ns-feature-item">
                    <span className="ns-feature-check">✓</span> Voice recording + transcription
                  </li>
                  <li className="ns-feature-item">
                    <span className="ns-feature-check">✓</span> Personalized prompts (pattern system)
                  </li>
                  <li className="ns-feature-item">
                    <span className="ns-feature-check">✓</span> Timeline + Book view
                  </li>
                  <li className="ns-feature-item">
                    <span className="ns-feature-check">✓</span> Family sharing + alerts
                  </li>
                  <li className="ns-feature-item">
                    <span className="ns-feature-check">✓</span> Lessons Learned extraction
                  </li>
                  <li className="ns-feature-item">
                    <span className="ns-feature-check">✓</span> Story enhancement AI
                  </li>
                  <li className="ns-feature-item">
                    <span className="ns-feature-check">✓</span> Multi-photo support
                  </li>
                  <li className="ns-feature-item">
                    <span className="ns-feature-check">✓</span> Family Circle collaboration
                  </li>
                </ul>
              </div>

              <div className="ns-card">
                <h3 className="ns-card-title">Future Roadmap</h3>
                <div className="ns-grid-2" style={{ gap: 'var(--space-16)' }}>
                  <div className="ns-card" style={{ padding: 'var(--space-12)', margin: 0 }}>
                    <div className="ns-card-subtitle">🎵 AUDIO</div>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}>
                      Audio cleanup (dead space, umms, volume leveling)
                    </div>
                  </div>
                  <div className="ns-card" style={{ padding: 'var(--space-12)', margin: 0 }}>
                    <div className="ns-card-subtitle">🌳 VISUALIZATION</div>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}>Visual family tree with pop-out facts</div>
                  </div>
                  <div className="ns-card" style={{ padding: 'var(--space-12)', margin: 0 }}>
                    <div className="ns-card-subtitle">📊 ANALYSIS</div>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}>
                      Character traits analysis (courage, perseverance, love 1-10 scales)
                    </div>
                  </div>
                  <div className="ns-card" style={{ padding: 'var(--space-12)', margin: 0 }}>
                    <div className="ns-card-subtitle">📚 CONTEXT</div>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}>
                      Time-relevant facts (popular bands, historical events by decade)
                    </div>
                  </div>
                  <div className="ns-card" style={{ padding: 'var(--space-12)', margin: 0 }}>
                    <div className="ns-card-subtitle">✍️ CREATION</div>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}>
                      Bio generator (timeline stories to compelling narrative)
                    </div>
                  </div>
                  <div className="ns-card" style={{ padding: 'var(--space-12)', margin: 0 }}>
                    <div className="ns-card-subtitle">🎤 INTERVIEW</div>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}>
                      Family interview mode (guided in-person recording)
                    </div>
                  </div>
                  <div className="ns-card" style={{ padding: 'var(--space-12)', margin: 0 }}>
                    <div className="ns-card-subtitle">📸 PHOTOS</div>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}>AI-enhanced photos in timeline</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lexicon Reference */}
            <div style={{ marginTop: 'var(--space-48)' }}>
              <div className="ns-lexicon">
                <h3 className="ns-lexicon-title">Our Language: Never Say AI</h3>
                <div className="ns-lexicon-item">
                  <span className="ns-lexicon-wrong">❌ AI</span>
                  <span className="ns-lexicon-right">✓ our story system</span>
                </div>
                <div className="ns-lexicon-item">
                  <span className="ns-lexicon-wrong">❌ AI prompts</span>
                  <span className="ns-lexicon-right">✓ guided questions</span>
                </div>
                <div className="ns-lexicon-item">
                  <span className="ns-lexicon-wrong">❌ AI analysis</span>
                  <span className="ns-lexicon-right">✓ story scan</span>
                </div>
                <div className="ns-lexicon-item">
                  <span className="ns-lexicon-wrong">❌ AI lessons</span>
                  <span className="ns-lexicon-right">✓ wisdom highlights</span>
                </div>
                <div className="ns-lexicon-item">
                  <span className="ns-lexicon-wrong">❌ AI character</span>
                  <span className="ns-lexicon-right">✓ traits &amp; threads</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="ns-footer">
          <div className="ns-container">
            <div className="ns-footer-brand">HeritageWhisper - Living Stories, Lasting Legacy</div>
            <div className="ns-footer-meta">Last updated: October 17, 2025 • Version 1.0</div>
          </div>
        </footer>
      </div>
    </>
  );
}
