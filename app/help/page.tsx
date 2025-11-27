"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
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
  HelpCircle,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { DesktopPageHeader, MobilePageHeader } from "@/components/PageHeader";

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
  icon: React.ReactNode;
}

interface FAQCategory {
  title: string;
  items: FAQItem[];
}

// Prevent static generation for this page
export const dynamic = 'force-dynamic';

export default function HelpPage() {
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

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
            <div className="space-y-4">
              <p className="text-base">When you click the <strong>+ button</strong>, you'll see two recording options. Pick the one that feels right for your story:</p>

              <div className="bg-gradient-to-br from-amber-50 to-rose-50 border-2 border-amber-200 rounded-lg p-5 mt-3">
                <strong className="block mb-3 text-lg text-amber-900">
                  💬 Conversation Mode
                </strong>
                <p className="text-base mb-3">A guided interview with thoughtful follow-up questions to help you share a deeper story.</p>
                <ul className="list-none space-y-2 ml-0 text-base">
                  <li><strong>Step 1:</strong> Click the <strong>+</strong> button</li>
                  <li><strong>Step 2:</strong> Choose <strong>"Conversation Mode"</strong></li>
                  <li><strong>Step 3:</strong> Answer the questions naturally - like talking to a friend</li>
                  <li className="text-sm text-amber-800 mt-3">⏱️ Takes about 10-15 minutes</li>
                </ul>
              </div>

              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-5 mt-3">
                <strong className="block mb-3 text-lg">
                  🎤 Quick Story
                </strong>
                <p className="text-base mb-3">Record a 2-5 minute story in one take. Simple and fast.</p>
                <ul className="list-none space-y-2 ml-0 text-base">
                  <li><strong>Step 1:</strong> Click the <strong>+</strong> button</li>
                  <li><strong>Step 2:</strong> Choose <strong>"Quick Story"</strong></li>
                  <li><strong>Step 3:</strong> Wait for the 3-2-1 countdown</li>
                  <li><strong>Step 4:</strong> Speak about your memory</li>
                  <li><strong>Step 5:</strong> Click <strong>"Stop"</strong> when done</li>
                  <li className="text-sm text-gray-600 mt-3">⏱️ Takes about 5 minutes total</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-base">
                  💡 <strong>Helpful Tips:</strong>
                </p>
                <ul className="list-disc ml-5 mt-2 space-y-1 text-base">
                  <li>Find a quiet room</li>
                  <li>Speak clearly and at a comfortable pace</li>
                  <li>Your voice is automatically transcribed to text</li>
                  <li>You can use both modes for different stories</li>
                </ul>
              </div>
            </div>
          ),
          icon: <Mic className="w-5 h-5" />,
        },
        {
          question: "Can I type my story instead of recording?",
          answer: (
            <div className="space-y-4">
              <p className="text-base">
                <strong>Yes!</strong> You can type your stories if you prefer. Here's how:
              </p>
              <ol className="list-none space-y-3 ml-0 text-base">
                <li><strong>Step 1:</strong> Record a short placeholder audio (just say "testing" for a few seconds)</li>
                <li><strong>Step 2:</strong> On the review screen, you'll see your transcribed text</li>
                <li><strong>Step 3:</strong> Click on the text to edit it</li>
                <li><strong>Step 4:</strong> Delete everything and type your own story</li>
                <li><strong>Step 5:</strong> Click <strong>"Save Memory"</strong> when you're done</li>
              </ol>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-base">
                  💡 <strong>Good to know:</strong> You can edit any text anytime. Your stories, your way!
                </p>
              </div>
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
            <div className="space-y-4">
              <p className="text-base"><strong>You can edit any memory anytime.</strong> Here's how:</p>
              <ol className="list-none space-y-3 ml-0 text-base">
                <li><strong>Step 1:</strong> Go to <strong>Book</strong> or <strong>Memory Box</strong></li>
                <li><strong>Step 2:</strong> Click on a memory card to open it</li>
                <li><strong>Step 3:</strong> Click the <strong>"Edit"</strong> button at the top</li>
                <li><strong>Step 4:</strong> Change anything you want: title, date, text, photos, or lesson learned</li>
                <li><strong>Step 5:</strong> Click <strong>"Save Memory"</strong> to keep your changes</li>
              </ol>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-base">
                  💡 <strong>Helpful Tip:</strong> Look for pencil icons ✏️ next to items you can edit. Click the pencil to change that section.
                </p>
              </div>
            </div>
          ),
          icon: <Edit3 className="w-5 h-5" />,
        },
        {
          question: "How many photos can I add to a memory?",
          answer: (
            <div className="space-y-4">
              <p className="text-base">
                <strong>You can add as many photos as you want</strong> to each memory. Here's what you can do:
              </p>
              <ul className="list-none space-y-2 ml-0 text-base">
                <li>✓ Upload photos when creating a story or add them later</li>
                <li>✓ Crop and zoom each photo to look just right</li>
                <li>✓ Pick one photo as your main "hero" image</li>
                <li>✓ Your photos show up in Timeline, Book, and Memory Box</li>
              </ul>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-base">
                  📸 <strong>Privacy Note:</strong> We automatically remove hidden location data from your photos to protect your privacy.
                </p>
              </div>
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
            <div className="space-y-4">
              <p className="text-base">
                <strong>Your subscription includes everything you need</strong> to preserve and share your family's memories:
              </p>
              <ul className="space-y-3 ml-0 text-base">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-heritage-coral mt-1 flex-shrink-0" />
                  <span>
                    <strong>Your storyteller account</strong> with unlimited memories and photos
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-heritage-coral mt-1 flex-shrink-0" />
                  <span>
                    <strong>Family sharing</strong> - Invite unlimited family members to view and contribute
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-heritage-coral mt-1 flex-shrink-0" />
                  <span>
                    <strong>Timeline view</strong> to see memories organized by year
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-heritage-coral mt-1 flex-shrink-0" />
                  <span>
                    <strong>Book view</strong> with beautiful two-page layouts
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-heritage-coral mt-1 flex-shrink-0" />
                  <span>
                    <strong>Memory box</strong> to organize all your stories in one place
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-heritage-coral mt-1 flex-shrink-0" />
                  <span>
                    <strong>Print at home</strong> with 2-up format for regular printers
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-heritage-coral mt-1 flex-shrink-0" />
                  <span>
                    <strong>Professional printing</strong> with trim format for book services
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-heritage-coral mt-1 flex-shrink-0" />
                  <span>
                    <strong>Secure cloud storage</strong> for all your audio recordings
                  </span>
                </li>
              </ul>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-base">
                  💡 <strong>Bonus:</strong> Wisdom highlights automatically pulled from each story
                </p>
              </div>
            </div>
          ),
          icon: <DollarSign className="w-5 h-5" />,
        },
        {
          question: "What comes with the free account?",
          answer: (
            <div className="space-y-4">
              <p className="text-base"><strong>Start for free!</strong> Try Heritage Whisper with your first 3 stories:</p>
              <div className="bg-heritage-coral/5 border-2 border-heritage-coral/20 rounded-lg p-5 mt-3">
                <p
                  className="font-semibold text-lg mb-3"
                  style={{ color: "#1f0f08" }}
                >
                  ✨ Your First 3 Stories Are Free
                </p>
                <p className="text-base text-gray-700">
                  Test every feature: recording, transcription, photos, Timeline, Book view, and PDF printing. All free for 3 stories.
                </p>
              </div>
              <p className="text-base text-gray-700 mt-4">
                After 3 stories, upgrade to keep adding unlimited memories and access all features.
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
    <div className="hw-page" style={{ backgroundColor: "var(--hw-page-bg, #faf8f5)" }}>
      {/* Desktop Header */}
      <DesktopPageHeader
        title="Help & FAQ"
        subtitle="Find answers to common questions about recording, editing, and sharing your memories"
      />

      {/* Mobile Header */}
      <MobilePageHeader
        title="Help & FAQ"
        subtitle="Common questions"
      />

      {/* Main content - centered */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">

        {/* Hero Section */}
        <section className="rounded-xl px-4 md:px-6 mb-8" style={{ backgroundColor: "var(--hw-section-bg, #EFE6DA)" }}>
          <div className="py-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "var(--hw-text-primary, #1F1F1F)" }}>
              How can we help you?
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--hw-text-secondary, #4A4A4A)" }}>
              Find answers to common questions about recording, editing, and
              sharing your life memories.
            </p>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="px-4 md:px-0">
          {categories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-10">
              <h3 className="text-2xl font-bold mb-6" style={{ color: "var(--hw-text-primary, #1F1F1F)" }}>
                {category.title}
              </h3>
              <div className="space-y-3">
                {category.items.map((item, itemIndex) => {
                  const key = `${categoryIndex}-${itemIndex}`;
                  const isExpanded = expandedItems.has(key);

                  return (
                    <div
                      key={key}
                      className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      style={{
                        backgroundColor: "var(--hw-surface, #FFFFFF)",
                        border: "1px solid var(--hw-border-subtle, #D2C9BD)"
                      }}
                    >
                      <button
                        onClick={() => toggleItem(key)}
                        className="w-full flex items-center justify-between p-5 text-left transition-colors"
                        style={{
                          backgroundColor: isExpanded ? "var(--hw-section-bg, #EFE6DA)" : "transparent"
                        }}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex-shrink-0" style={{ color: "var(--hw-secondary, #3E6A5A)" }}>
                            {item.icon}
                          </div>
                          <span className="font-semibold text-lg" style={{ color: "var(--hw-text-primary, #1F1F1F)" }}>
                            {item.question}
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 transition-transform flex-shrink-0 ml-3 ${
                            isExpanded ? "transform rotate-180" : ""
                          }`}
                          style={{ color: "var(--hw-text-muted, #8A8378)" }}
                        />
                      </button>

                      {isExpanded && (
                        <div className="px-5 pb-5 pt-0">
                          <div className="pl-8 leading-relaxed" style={{ color: "var(--hw-text-secondary, #4A4A4A)" }}>
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
          <div className="rounded-xl p-8 text-center" style={{
            backgroundColor: "var(--hw-section-bg, #EFE6DA)",
            border: "1px solid var(--hw-border-subtle, #D2C9BD)"
          }}>
            <h3 className="text-2xl font-bold mb-3" style={{ color: "var(--hw-text-primary, #1F1F1F)" }}>
              Still have questions?
            </h3>
            <p className="text-lg mb-6" style={{ color: "var(--hw-text-secondary, #4A4A4A)" }}>
              We're here to help! Reach out to our support team anytime.
            </p>
            <Button
              onClick={() =>
                (window.location.href = "mailto:support@heritagewhisper.com")
              }
              className="text-white px-8 rounded-xl min-h-[60px] text-lg font-medium"
              style={{ backgroundColor: "var(--hw-primary, #203954)" }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--hw-primary-hover, #1B3047)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--hw-primary, #203954)"}
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
