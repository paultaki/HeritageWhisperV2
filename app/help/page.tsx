"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  HelpCircle,
  Mic,
  Edit3,
  Image as ImageIcon,
  Book,
  Printer,
  ArrowLeft,
  ChevronDown,
  Keyboard,
  Smartphone,
  DollarSign,
  Check,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LeftSidebar } from "@/components/LeftSidebar";
import { useMediaQuery } from "@/hooks/use-media-query";

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
  icon: React.ReactNode;
}

interface FAQCategory {
  title: string;
  items: FAQItem[];
}

export default function HelpPage() {
  const router = useRouter();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const updateFromDom = () => {
      const dark =
        document.documentElement.classList.contains("dark") ||
        document.body.classList.contains("dark");
      setIsDark(dark);
    };
    updateFromDom();
    const handler = () => updateFromDom();
    window.addEventListener("hw-theme-change", handler);
    return () => window.removeEventListener("hw-theme-change", handler);
  }, []);

  const toggleItem = (key: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedItems(newExpanded);
  };

  const categories: FAQCategory[] = [
    {
      title: "Getting Started",
      items: [
        {
          question: "How do I record a new memory?",
          answer: (
            <div className="space-y-3">
              <p>You have two ways to record your memories:</p>

              <div className="bg-gradient-to-br from-amber-50 to-rose-50 border-2 border-amber-200 rounded-lg p-4 mt-3">
                <strong className="block mb-2 text-amber-900">
                  💬 Conversation Mode (Guided Interview with Pearl)
                </strong>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Click the <strong>+</strong> button and choose <strong>"Conversation Mode"</strong></li>
                  <li>Pearl, your AI interviewer, will ask you thoughtful questions</li>
                  <li>Simply answer naturally - she listens and follows up based on what you share</li>
                  <li>Perfect for exploring memories in depth (10-15 minutes)</li>
                  <li>Your full conversation is recorded and saved as one story</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-3">
                <strong className="block mb-2">
                  🎤 Quick Story (Solo Recording)
                </strong>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Click the <strong>+</strong> button and choose <strong>"Quick Story"</strong></li>
                  <li>You'll see a 3-2-1 countdown, then recording begins</li>
                  <li>Speak naturally about your memory (2-5 minutes)</li>
                  <li>Click <strong>"Stop"</strong> when finished</li>
                  <li>Great for capturing quick memories on the fly</li>
                </ul>
              </div>

              <p className="text-sm text-gray-600 mt-3">
                💡 <strong>Tip:</strong> Both modes automatically transcribe your audio. Find a quiet space and speak clearly for best results!
              </p>
            </div>
          ),
          icon: <Mic className="w-5 h-5" />,
        },
        {
          question: "Can I type my story instead of recording?",
          answer: (
            <div className="space-y-3">
              <p>
                Yes! After recording (or even without recording), you can edit
                and type your story:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>
                  Record a brief placeholder (or skip recording and create from
                  Memory Box)
                </li>
                <li>
                  On the review screen, click directly on the transcription text
                </li>
                <li>Delete the transcribed text and type your own story</li>
                <li>Format it however you'd like</li>
                <li>
                  Click <strong>"Save Memory"</strong> when done
                </li>
              </ol>
              <p className="text-sm text-gray-600 mt-3">
                You have complete control to edit, rewrite, or type your
                memories from scratch.
              </p>
            </div>
          ),
          icon: <Edit3 className="w-5 h-5" />,
        },
      ],
    },
    {
      title: "Editing & Managing Memories",
      items: [
        {
          question: "How do I edit a memory?",
          answer: (
            <div className="space-y-3">
              <p>You can edit any memory at any time:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>
                  Go to <strong>Timeline</strong>, <strong>Book</strong>, or{" "}
                  <strong>Memory Box</strong>
                </li>
                <li>Click on any memory card to open it</li>
                <li>
                  Click the <strong>"Edit"</strong> button at the top
                </li>
                <li>
                  Edit the title, date, transcription, photos, or lesson learned
                </li>
                <li>
                  Click <strong>"Save Memory"</strong> to keep your changes
                </li>
              </ol>
              <p className="text-sm text-gray-600 mt-3">
                💡 <strong>Tip:</strong> Pencil icons appear next to editable
                fields. Click them to edit specific sections.
              </p>
            </div>
          ),
          icon: <Edit3 className="w-5 h-5" />,
        },
        {
          question: "How many photos can I add to a memory?",
          answer: (
            <div className="space-y-3">
              <p>
                You can add <strong>multiple photos</strong> to each memory:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Upload photos during or after creating a memory</li>
                <li>Crop and adjust each photo before saving</li>
                <li>
                  Select one photo as your "hero" image (the main photo
                  displayed)
                </li>
                <li>Photos appear in your Timeline, Book, and Memory Box</li>
              </ul>
              <p className="text-sm text-gray-600 mt-3">
                📸 <strong>Note:</strong> For privacy, we automatically remove
                EXIF data (location, camera info) from uploaded photos.
              </p>
            </div>
          ),
          icon: <ImageIcon className="w-5 h-5" />,
        },
      ],
    },
    {
      title: "Navigating Your Story",
      items: [
        {
          question: "How do I navigate through the Book view?",
          answer: (
            <div className="space-y-3">
              <p>There are several ways to navigate your book:</p>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Keyboard className="w-4 h-4 text-heritage-coral" />
                  <strong>Desktop (Keyboard)</strong>
                </div>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>
                    <strong>Left/Right Arrow Keys:</strong> Navigate between
                    pages
                  </li>
                  <li>Works on all desktop browsers</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-4 h-4 text-heritage-coral" />
                  <strong>Mobile & Desktop (Touch/Click)</strong>
                </div>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>
                    <strong>Navigation Arrows:</strong> Tap/click the arrows on
                    each side to turn pages
                  </li>
                  <li>
                    <strong>Decade Navigation:</strong> Click any decade to jump
                    to that section
                  </li>
                  <li>
                    <strong>Swipe:</strong> Swipe left/right on mobile devices
                  </li>
                </ul>
              </div>

              <p className="text-sm text-gray-600 mt-3">
                💡 <strong>Tip:</strong> The decade navigation menu on the left
                side collapses by default. Click it to see your full table of
                contents!
              </p>
            </div>
          ),
          icon: <Book className="w-5 h-5" />,
        },
      ],
    },
    {
      title: "Printing & Exporting",
      items: [
        {
          question: "How do I print my story?",
          answer: (
            <div className="space-y-3">
              <p>You have multiple printing options:</p>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-3">
                <strong className="block mb-2">
                  📄 2-Up Format (Home Printing)
                </strong>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>Designed for standard 8.5" × 11" paper</li>
                  <li>Two pages per sheet</li>
                  <li>Perfect for home or office printers</li>
                  <li>Access from Book view → Print icon</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-3">
                <strong className="block mb-2">
                  📚 Trim Format (Professional Printing)
                </strong>
                <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                  <li>
                    Full-page layout optimized for print-on-demand services
                  </li>
                  <li>Professional book formatting with proper margins</li>
                  <li>Export as PDF to send to a printing service</li>
                  <li>Access from Book view → Print icon</li>
                </ul>
              </div>

              <p className="text-sm text-gray-600 mt-3">
                💡 <strong>Tip:</strong> Use Print Preview in your browser to
                adjust page settings before printing.
              </p>
            </div>
          ),
          icon: <Printer className="w-5 h-5" />,
        },
        {
          question: "Do you offer printed books?",
          answer: (
            <div className="space-y-3">
              <p className="text-lg">
                <strong>Not yet – but stay tuned!</strong> 🎉
              </p>
              <p>
                We're working on partnerships with professional printing
                services to offer beautifully bound, heirloom-quality printed
                books of your memories.
              </p>
              <p>In the meantime, you can:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Export your book as PDF using our Trim format</li>
                <li>
                  Take it to your local print shop or online service like Blurb,
                  Lulu, or Amazon KDP
                </li>
                <li>
                  Choose your preferred binding, paper quality, and cover design
                </li>
              </ul>
              <p className="text-sm text-gray-600 mt-3">
                📬 Want to be notified when printed books are available? Enable
                the "Printed Books Availability" toggle in your{" "}
                <strong>Profile → Notification Preferences</strong>.
              </p>
            </div>
          ),
          icon: <Book className="w-5 h-5" />,
        },
      ],
    },
    {
      title: "Pricing & Subscription",
      items: [
        {
          question: "What's included in the subscription?",
          answer: (
            <div className="space-y-3">
              <p>
                Your Heritage Whisper subscription includes everything you need
                to preserve your family's memories:
              </p>
              <ul className="space-y-2 ml-2">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-heritage-coral mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>One storyteller account</strong> for unlimited
                    memories
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-heritage-coral mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>One year</strong> of full access to all features
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-heritage-coral mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Timeline view</strong> to see your memories
                    chronologically
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-heritage-coral mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Book view</strong> with beautiful page layouts
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-heritage-coral mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Memory box</strong> to organize and manage all your
                    stories
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-heritage-coral mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Printable book</strong> in 2-up format for home
                    printing
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-heritage-coral mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Downloadable book</strong> in trim format for
                    professional printing
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-heritage-coral mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>E-book with audio</strong> to listen and read
                    together
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-heritage-coral mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Stored audio clips</strong> securely saved in the
                    cloud
                  </span>
                </li>
              </ul>
            </div>
          ),
          icon: <DollarSign className="w-5 h-5" />,
        },
        {
          question: "What comes with the free account?",
          answer: (
            <div className="space-y-3">
              <p>Start preserving your memories today with our free trial:</p>
              <div className="bg-heritage-coral/5 border border-heritage-coral/20 rounded-lg p-4 mt-3">
                <p
                  className="font-semibold text-lg mb-2"
                  style={{ color: "#1f0f08" }}
                >
                  ✨ Full functionality for your first 3 stories
                </p>
                <p className="text-sm text-gray-600">
                  Try all features including recording, transcription, photo
                  uploads, timeline view, book view, and PDF export—completely
                  free for your first 3 memories.
                </p>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                After your 3 free stories, upgrade to a paid subscription to
                continue adding unlimited memories.
              </p>
            </div>
          ),
          icon: <DollarSign className="w-5 h-5" />,
        },
        {
          question: "Can I get a refund?",
          answer: (
            <div className="space-y-3">
              <p>
                Yes! We want you to be completely satisfied with Heritage
                Whisper.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-3">
                <p className="font-semibold mb-2">
                  30-Day Money-Back Guarantee
                </p>
                <p className="text-sm text-gray-600">
                  If you're not satisfied with your subscription for any reason,
                  contact us within 30 days of purchase for a full refund—no
                  questions asked.
                </p>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                📧 To request a refund, email us at{" "}
                <strong>support@heritagewhisper.com</strong>
                with your account details.
              </p>
            </div>
          ),
          icon: <DollarSign className="w-5 h-5" />,
        },
      ],
    },
    {
      title: "Privacy & Account",
      items: [
        {
          question: "Is my data private and secure?",
          answer: (
            <div className="space-y-3">
              <p>
                Yes! Your memories are precious, and we take privacy seriously:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  <strong>Private by default:</strong> Only you can see your
                  memories
                </li>
                <li>
                  <strong>EXIF stripping:</strong> Location data and camera info
                  are removed from photos
                </li>
                <li>
                  <strong>Secure storage:</strong> All data encrypted and stored
                  securely
                </li>
                <li>
                  <strong>Control what's visible:</strong> Mark memories as
                  private, timeline-only, or book-only
                </li>
                <li>
                  <strong>Data export:</strong> Download all your data anytime
                </li>
              </ul>
            </div>
          ),
          icon: <HelpCircle className="w-5 h-5" />,
        },
        {
          question: "How do I delete my account?",
          answer: (
            <div className="space-y-3">
              <p>
                We hope you'll stay, but if you need to delete your account:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>
                  Go to <strong>Profile</strong> → <strong>Settings</strong>
                </li>
                <li>
                  Scroll to <strong>Account Management</strong>
                </li>
                <li>
                  Click <strong>"Delete Account"</strong>
                </li>
                <li>Confirm the deletion (this cannot be undone)</li>
              </ol>
              <p className="text-sm text-red-600 mt-3">
                ⚠️ <strong>Warning:</strong> This permanently deletes all your
                memories, photos, and audio recordings. Consider exporting your
                data first!
              </p>
            </div>
          ),
          icon: <HelpCircle className="w-5 h-5" />,
        },
      ],
    },
  ];

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: isDark ? "#1c1c1d" : "#FFF8F3" }}
    >
      {/* Header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur"
        style={{
          backgroundColor: isDark ? '#252728' : 'rgba(255,255,255,0.95)',
          borderBottom: `1px solid ${isDark ? '#3b3d3f' : '#e5e7eb'}`,
          color: isDark ? '#b0b3b8' : undefined,
          height: 55,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          width: '100%'
        }}
      >
        <div className="flex items-center gap-3 w-full">
          <Image
            src="/h-whiper.png"
            alt="Heritage Whisper"
            width={36}
            height={36}
            className="h-9 w-auto"
          />
          <HelpCircle className="w-6 h-6" style={{ color: isDark ? '#b0b3b8' : '#1f2937' }} />
          <h1 className="text-2xl font-bold" style={{ color: isDark ? '#b0b3b8' : '#111827' }}>Help & FAQ</h1>
        </div>
      </header>

      {/* Left Sidebar - Desktop Only */}
      {isDesktop && (
        <aside
          className="hidden lg:flex lg:w-56 flex-col gap-1.5 p-2"
          style={{
            position: "fixed",
            top: 72,
            left: 0,
            height: "calc(100vh - 72px)",
            backgroundColor: "transparent",
            borderRight: "none",
            color: isDark ? "#b0b3b8" : undefined,
          }}
        >
          <LeftSidebar />
        </aside>
      )}

      {/* Main content - with header and sidebar spacing */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0 lg:ml-56" style={{ marginTop: 55 }}>
        <div className="max-w-4xl mx-auto p-4 md:p-6">

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-heritage-coral/5 to-heritage-coral/10 border rounded-lg mx-4 md:-mx-6 px-4 md:px-6 mb-8">
          <div className="py-12 text-center">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: "#1f0f08" }}
            >
              How can we help you?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about recording, editing, and
              sharing your life memories.
            </p>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="px-4 md:px-0">
          {categories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-10">
              <h3
                className="text-2xl font-bold mb-6"
                style={{ color: "#1f0f08" }}
              >
                {category.title}
              </h3>
              <div className="space-y-3">
                {category.items.map((item, itemIndex) => {
                  const key = `${categoryIndex}-${itemIndex}`;
                  const isExpanded = expandedItems.has(key);

                  return (
                    <div
                      key={key}
                      className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <button
                        onClick={() => toggleItem(key)}
                        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex-shrink-0 text-heritage-coral">
                            {item.icon}
                          </div>
                          <span
                            className="font-semibold text-lg"
                            style={{ color: "#1f0f08" }}
                          >
                            {item.question}
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-3 ${
                            isExpanded ? "transform rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isExpanded && (
                        <div className="px-5 pb-5 pt-0">
                          <div className="pl-8 text-gray-700 leading-relaxed">
                            {typeof item.answer === "string" ? (
                              <p>{item.answer}</p>
                            ) : (
                              item.answer
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        {/* Contact Section */}
        <section className="py-12 mb-8 px-4 md:px-0">
          <div className="bg-gradient-to-br from-heritage-coral/10 to-heritage-coral/5 border border-heritage-coral/20 rounded-xl p-8 text-center">
            <h3
              className="text-2xl font-bold mb-3"
              style={{ color: "#1f0f08" }}
            >
              Still have questions?
            </h3>
            <p className="text-gray-600 mb-6">
              We're here to help! Reach out to our support team anytime.
            </p>
            <Button
              onClick={() =>
                (window.location.href = "mailto:support@heritagewhisper.com")
              }
              className="bg-heritage-coral hover:bg-heritage-coral/90 text-white px-6 py-3 rounded-full"
            >
              Contact Support
            </Button>
          </div>
        </section>
        </div>
      </main>
    </div>
  );
}
