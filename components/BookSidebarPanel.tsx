"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Calendar, BookOpen, Box, Sparkles, ChevronRight, X, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { BookPage } from "@/lib/bookPagination";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface DecadeSection {
  decade: string;
  title: string;
  startPage: number;
  stories: Array<{
    title: string;
    pageNumber: number;
    year: string;
  }>;
}

interface BookStructure {
  decades: DecadeSection[];
  totalPages: number;
}

interface BookSidebarPanelProps {
  pages: BookPage[];
  currentPage: number;
  onNavigateToPage: (pageNumber: number) => void;
  onRecordClick: () => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build navigation structure from book pages
 */
function buildBookStructure(pages: BookPage[]): BookStructure {
  const decades: DecadeSection[] = [];
  const decadeMap = new Map<string, DecadeSection>();

  pages.forEach((page) => {
    // Find decade markers
    if (page.type === "decade-marker" && page.decade) {
      if (!decadeMap.has(page.decade)) {
        decadeMap.set(page.decade, {
          decade: page.decade,
          title: page.decadeTitle || page.decade,
          startPage: page.pageNumber,
          stories: [],
        });
      }
    }

    // Find story starts
    if (
      (page.type === "story-start" || page.type === "story-complete") &&
      page.title &&
      page.year
    ) {
      const decade = `${Math.floor(parseInt(page.year) / 10) * 10}s`;
      const decadeSection = decadeMap.get(decade);
      if (decadeSection) {
        // Avoid duplicates
        const exists = decadeSection.stories.some(
          (s) => s.title === page.title && s.pageNumber === page.pageNumber,
        );
        if (!exists) {
          decadeSection.stories.push({
            title: page.title,
            pageNumber: page.pageNumber,
            year: page.year,
          });
        }
      }
    }
  });

  // Convert to array and sort by decade
  const sortedDecades = Array.from(decadeMap.values()).sort((a, b) => {
    const aYear = parseInt(a.decade);
    const bYear = parseInt(b.decade);
    return aYear - bYear;
  });

  return {
    decades: sortedDecades,
    totalPages: pages.length,
  };
}

// ============================================================================
// NAV ITEM COMPONENT
// ============================================================================

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  href?: string;
  isActive?: boolean;
  onClick?: () => void;
}

function NavItem({ icon: Icon, label, href, isActive, onClick }: NavItemProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl transition-all hover:bg-gray-100 group w-full relative"
      style={{
        color: isActive ? "#D36A3D" : "hsl(210, 10%, 60%)",
        background: isActive ? "#FFF5F0" : "transparent",
      }}
    >
      {/* Active indicator bar on right */}
      {isActive && (
        <div
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all"
          style={{
            backgroundColor: "#D36A3D",
            height: "70px",
          }}
        />
      )}
      <Icon className="w-6 h-6 flex-shrink-0" />
      <span className="text-xs font-medium text-center">{label}</span>
    </button>
  );
}

// ============================================================================
// MAIN BOOK SIDEBAR PANEL COMPONENT
// ============================================================================

export default function BookSidebarPanel({
  pages,
  currentPage,
  onNavigateToPage,
  onRecordClick,
}: BookSidebarPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedDecades, setExpandedDecades] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);
  const hasAutoOpenedRef = useRef(false);

  const bookStructure = buildBookStructure(pages);

  // Auto-open panel briefly on mount to show it exists, then auto-close
  useEffect(() => {
    if (!hasAutoOpenedRef.current) {
      hasAutoOpenedRef.current = true;
      // Open immediately
      setIsOpen(true);
      // Auto-close after 2 seconds
      const timer = setTimeout(() => {
        setIsOpen(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Auto-expand current decade
  useEffect(() => {
    const currentDecade = bookStructure.decades.find((d) =>
      d.stories.some((s) => s.pageNumber === currentPage + 1),
    );
    if (currentDecade) {
      setExpandedDecades((prev) => new Set(prev).add(currentDecade.decade));
    }
  }, [currentPage, bookStructure]);

  // Close panel when clicking on book content
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Close if clicking on book content areas
      if (
        isOpen &&
        !panelRef.current?.contains(target) &&
        !target.closest('[data-book-sidebar-tab]')
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const toggleDecade = (decade: string) => {
    setExpandedDecades((prev) => {
      const next = new Set(prev);
      if (next.has(decade)) {
        next.delete(decade);
      } else {
        next.add(decade);
      }
      return next;
    });
  };

  const handleNavigate = (pageNumber: number) => {
    onNavigateToPage(pageNumber - 1); // Convert to 0-indexed
    setIsOpen(false);
  };

  const handleNavItemClick = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Orange tab - visible when panel is closed */}
      {!isOpen && (
        <button
          onClick={togglePanel}
          className="fixed top-1/2 left-0 -translate-y-1/2 w-12 h-24 bg-amber-600 hover:bg-amber-700 rounded-r-lg shadow-lg hover:shadow-xl transition-all z-50 flex items-center justify-center border border-l-0 border-amber-700 hover:w-14"
          aria-label="Open navigation and table of contents"
          data-book-sidebar-tab
        >
          <Menu className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Slide-out panel */}
      <motion.div
        ref={panelRef}
        initial={{ x: "-100%" }}
        animate={{ x: isOpen ? 0 : "-100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed top-0 left-0 bottom-0 bg-white shadow-2xl z-50 flex"
        style={{ width: "432px" }} // 112px nav + 320px TOC
      >
        {/* Navigation Section (Left side - 112px) */}
        <div className="w-28 bg-white/90 backdrop-blur-md border-r-2 flex-shrink-0 flex flex-col py-8 px-3" style={{ borderRightColor: "#D36A3D" }}>
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <Image
              src="/final logo/logo-new.svg"
              alt="HeritageWhisper"
              width={80}
              height={48}
              className="object-contain"
            />
          </div>

          {/* Navigation Items - Order: Timeline, Book, Record, Memories, Prompts */}
          <div className="flex-1 flex flex-col space-y-2">
            <NavItem
              icon={Calendar}
              label="Timeline"
              href="/timeline"
              isActive={pathname === "/timeline"}
              onClick={() => handleNavItemClick("/timeline")}
            />

            <NavItem
              icon={BookOpen}
              label="Book"
              href="/book"
              isActive={pathname.startsWith("/book")}
            />

            {/* Record Button */}
            <button
              onClick={() => {
                onRecordClick();
                setIsOpen(false);
              }}
              className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl transition-all hover:bg-red-50 group w-full my-2"
              style={{
                background: "linear-gradient(135deg, #D36A3D 0%, #C05A2D 100%)",
                boxShadow: "0 4px 12px rgba(211, 106, 61, 0.4)",
              }}
            >
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                <Image src="/REC_Mic.png" alt="Record" width={20} height={20} />
              </div>
              <span className="text-xs font-medium text-white text-center">
                Record
              </span>
            </button>

            <NavItem
              icon={Box}
              label="Memories"
              href="/memory-box"
              isActive={pathname === "/memory-box"}
              onClick={() => handleNavItemClick("/memory-box")}
            />

            <NavItem
              icon={Sparkles}
              label="Prompts"
              href="/prompts"
              isActive={pathname === "/prompts"}
              onClick={() => handleNavItemClick("/prompts")}
            />
          </div>
        </div>

        {/* Table of Contents Section (Right side - 320px) */}
        <div className="flex-1 flex flex-col">
          {/* Header with close button */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-serif font-semibold text-gray-800">
              Table of Contents
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Scrollable TOC content */}
          <div className="overflow-y-auto flex-1 px-4 py-4">
            {bookStructure.decades.map((decade) => {
              const isExpanded = expandedDecades.has(decade.decade);
              const isCurrentDecade = decade.stories.some(
                (s) => s.pageNumber === currentPage + 1,
              );

              return (
                <div key={decade.decade} className="mb-4">
                  {/* Decade header */}
                  <button
                    onClick={() => toggleDecade(decade.decade)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                      isCurrentDecade
                        ? "bg-amber-50 text-amber-900"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-semibold">
                        {decade.title}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({decade.stories.length})
                      </span>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </button>

                  {/* Story list */}
                  {isExpanded && (
                    <div className="mt-1 ml-3 space-y-1">
                      {decade.stories.map((story, idx) => {
                        const isCurrent = story.pageNumber === currentPage + 1;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleNavigate(story.pageNumber)}
                            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                              isCurrent
                                ? "bg-amber-100 text-amber-900 font-medium"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                          >
                            <div className="flex justify-between items-baseline">
                              <span className="flex-1 pr-2">{story.title}</span>
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                p.{story.pageNumber}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Orange close tab on right edge when open */}
        {isOpen && (
          <button
            onClick={() => setIsOpen(false)}
            className="absolute -right-12 top-1/2 -translate-y-1/2 w-12 h-24 bg-amber-600 hover:bg-amber-700 rounded-r-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center border border-l-0 border-amber-700"
            aria-label="Close navigation"
            data-book-sidebar-tab
          >
            <X className="w-6 h-6 text-white" />
          </button>
        )}
      </motion.div>
    </>
  );
}
