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
              <p className="text-base">When you tap <strong>Record</strong> in the navigation, you'll see options to start your story. Pick the one that feels right:</p>

              <div className="bg-gradient-to-br from-amber-50 to-rose-50 border-2 border-amber-200 rounded-lg p-5 mt-3">
                <strong className="block mb-3 text-lg text-amber-900">
                  📷 Record with photo
                </strong>
                <p className="text-base mb-3">Choose a photo first, then tell its story.</p>
                <ul className="list-none space-y-2 ml-0 text-base">
                  <li><strong>Step 1:</strong> Tap <strong>"Record with photo"</strong></li>
                  <li><strong>Step 2:</strong> Select a photo from your device</li>
                  <li><strong>Step 3:</strong> Speak about the memory behind the photo</li>
                  <li><strong>Step 4:</strong> Tap <strong>"Stop"</strong> when done</li>
                </ul>
              </div>

              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-5 mt-3">
                <strong className="block mb-3 text-lg">
                  🎤 Start recording
                </strong>
                <p className="text-base mb-3">Start now and add photos anytime.</p>
                <ul className="list-none space-y-2 ml-0 text-base">
                  <li><strong>Step 1:</strong> Tap <strong>"Start recording"</strong></li>
                  <li><strong>Step 2:</strong> Wait for the countdown</li>
                  <li><strong>Step 3:</strong> Speak about your memory</li>
                  <li><strong>Step 4:</strong> Tap <strong>"Stop"</strong> when done</li>
                  <li><strong>Step 5:</strong> Add photos on the review screen (optional)</li>
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
                  <li>You can add or change photos after recording</li>
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
                <strong>Yes!</strong> You can type your stories if you prefer writing. Here's how:
              </p>
              <ol className="list-none space-y-3 ml-0 text-base">
                <li><strong>Step 1:</strong> Tap <strong>Record</strong> in the navigation</li>
                <li><strong>Step 2:</strong> Tap <strong>"Prefer to type instead?"</strong> at the bottom</li>
                <li><strong>Step 3:</strong> Type your story</li>
                <li><strong>Step 4:</strong> Add photos (optional)</li>
                <li><strong>Step 5:</strong> Tap <strong>"Save Memory"</strong> when you're done</li>
              </ol>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-base">
                  💡 <strong>Good to know:</strong> You can edit any story's text anytime. Your stories, your way!
                </p>
              </div>
            </div>
          ),
          icon: <Edit3 className="w-5 h-5" />,
        },
        {
          question: "How do I get back to my stories?",
          answer: (
            <div className="space-y-4">
              <p className="text-base">Your stories are always safe and easy to find:</p>
              <ul className="list-none space-y-3 ml-0 text-base">
                <li>
                  <strong>Timeline:</strong> Tap "Timeline" to see all your memories organized by year
                </li>
                <li>
                  <strong>Book:</strong> Tap "Book" to read your stories like a memoir
                </li>
                <li>
                  <strong>Memory Box:</strong> Tap "Menu" → "Memory Box" to see all stories and treasures in one place
                </li>
              </ul>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-base">
                  💡 <strong>Tip:</strong> The navigation bar at the bottom of the screen is always there to help you move around.
                </p>
              </div>
            </div>
          ),
          icon: <Book className="w-5 h-5" />,
        },
        {
          question: "What if I make a mistake while recording?",
          answer: (
            <div className="space-y-4">
              <p className="text-base">No worries! You can always re-record or edit:</p>
              <ul className="list-none space-y-3 ml-0 text-base">
                <li>If you don't like a recording, simply don't save it and start over</li>
                <li>If you already saved it, you can edit the text anytime</li>
                <li>You can also delete any memory and record it again</li>
              </ul>
              <p className="text-base mt-3">
                There's no pressure to get it perfect the first time. Just talk naturally!
              </p>
            </div>
          ),
          icon: <Mic className="w-5 h-5" />,
        },
        {
          question: "Do I need to finish my story in one sitting?",
          answer: (
            <div className="space-y-4">
              <p className="text-base">Each recording is saved as its own memory, so you can:</p>
              <ul className="list-none space-y-3 ml-0 text-base">
                <li>Record one short story today and another tomorrow</li>
                <li>Keep each memory to 2-5 minutes (easier to record and nicer to listen to)</li>
                <li>Add as many separate memories as you want over time</li>
              </ul>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-base">
                  💡 <strong>Tip:</strong> Short stories are often the most meaningful. It's better to have 20 short memories than to wait for time to record one long one.
                </p>
              </div>
            </div>
          ),
          icon: <Mic className="w-5 h-5" />,
        },
        {
          question: "I don't know what stories to tell. Where do I start?",
          answer: (
            <div className="space-y-4">
              <p className="text-base">We've got you covered! Heritage Whisper includes personalized <strong>Story Ideas</strong> to spark your memory:</p>
              <ol className="list-none space-y-3 ml-0 text-base">
                <li><strong>Step 1:</strong> Tap <strong>Menu</strong> → <strong>Story Ideas</strong></li>
                <li><strong>Step 2:</strong> Browse through thoughtful prompts designed to help you remember meaningful moments</li>
                <li><strong>Step 3:</strong> Tap any idea that speaks to you to start recording</li>
              </ol>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-3">
                <p className="text-base mb-2"><strong>Some example prompts:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-base text-gray-700">
                  <li>"What's a smell that instantly takes you back to childhood?"</li>
                  <li>"Tell me about a time you were really proud of yourself"</li>
                  <li>"What's a tradition you hope your family continues?"</li>
                </ul>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-base">
                  💡 <strong>Tip:</strong> You don't have to answer the prompt exactly - let it be a jumping-off point. One memory often leads to another!
                </p>
              </div>
            </div>
          ),
          icon: <HelpCircle className="w-5 h-5" />,
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
              <p className="text-base">There are several ways to navigate your book:</p>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Keyboard className="w-4 h-4 text-heritage-coral" />
                  <strong>Desktop (Keyboard)</strong>
                </div>
                <ul className="list-disc list-inside space-y-1 ml-2 text-base">
                  <li>
                    <strong>Left/Right Arrow Keys:</strong> Navigate between pages
                  </li>
                  <li>Works on all desktop browsers</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-4 h-4 text-heritage-coral" />
                  <strong>Mobile & Desktop (Touch/Click)</strong>
                </div>
                <ul className="list-disc list-inside space-y-1 ml-2 text-base">
                  <li>
                    <strong>Navigation Arrows:</strong> Tap/click the arrows on each side to turn pages
                  </li>
                  <li>
                    <strong>Decade Timeline:</strong> Use the timeline bar at the top to jump to any decade
                  </li>
                  <li>
                    <strong>Swipe:</strong> Swipe left/right on mobile devices
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-3">
                <strong className="block mb-2">View Options</strong>
                <ul className="list-disc list-inside space-y-1 ml-2 text-base">
                  <li>
                    <strong>Time/Chapters toggle:</strong> Switch between timeline view and chapter view using the toggle in the top right
                  </li>
                  <li>
                    <strong>Table of Contents:</strong> Tap the book icon to see all your stories organized by decade
                  </li>
                </ul>
              </div>

              <p className="text-base text-gray-600 mt-3">
                💡 <strong>Tip:</strong> Use the "Chapters" view to see your stories organized by life chapters rather than strict timeline order!
              </p>
            </div>
          ),
          icon: <Book className="w-5 h-5" />,
        },
      ],
    },
    {
      title: "Technical Help",
      items: [
        {
          question: "What if I can't hear my recording?",
          answer: (
            <div className="space-y-4">
              <p className="text-base">Try these steps:</p>
              <ul className="list-none space-y-3 ml-0 text-base">
                <li>Make sure your device volume is turned up</li>
                <li>Check that your device isn't on silent/mute</li>
                <li>Look for the Play button (▶️) on any story and tap it</li>
                <li>If using headphones, make sure they're connected properly</li>
              </ul>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-base">
                  💡 <strong>Tip:</strong> You can always read the written transcript even if audio isn't working.
                </p>
              </div>
            </div>
          ),
          icon: <HelpCircle className="w-5 h-5" />,
        },
        {
          question: "The app isn't responding. What do I do?",
          answer: (
            <div className="space-y-4">
              <p className="text-base">Try these simple fixes:</p>
              <ul className="list-none space-y-3 ml-0 text-base">
                <li>
                  <strong>Refresh the page</strong> - On a computer, press the circular arrow or F5. On a tablet, pull down on the screen.
                </li>
                <li>
                  <strong>Close and reopen</strong> - Close your browser completely and open Heritage Whisper again
                </li>
                <li>
                  <strong>Check your internet</strong> - Make sure you're connected to WiFi or cellular data
                </li>
                <li>
                  <strong>Try again later</strong> - Sometimes waiting a few minutes helps
                </li>
              </ul>
              <p className="text-base mt-3">
                Your stories are safely saved, so you won't lose anything.
              </p>
            </div>
          ),
          icon: <HelpCircle className="w-5 h-5" />,
        },
        {
          question: "Can I use Heritage Whisper on my tablet/iPad?",
          answer: (
            <div className="space-y-4">
              <p className="text-base"><strong>Yes!</strong> Heritage Whisper works on:</p>
              <ul className="list-none space-y-3 ml-0 text-base">
                <li>
                  <strong>Tablets and iPads</strong> (recommended for seniors - bigger screen!)
                </li>
                <li>
                  <strong>Computers</strong> (desktop or laptop)
                </li>
                <li>
                  <strong>Smartphones</strong> (iPhone or Android)
                </li>
              </ul>
              <p className="text-base mt-3">
                Simply open your web browser (Safari, Chrome, etc.) and go to heritagewhisper.com. No app download needed.
              </p>
            </div>
          ),
          icon: <Smartphone className="w-5 h-5" />,
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
                the "Printed Books Availability" toggle in{" "}
                <strong>Menu → Settings → Notification Preferences</strong>.
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
          question: "How much does Heritage Whisper cost?",
          answer: (
            <div className="space-y-4">
              <p className="text-base">
                Heritage Whisper offers simple, transparent pricing:
              </p>

              <div className="bg-gradient-to-br from-amber-50 to-rose-50 border-2 border-amber-200 rounded-lg p-5 mt-3">
                <strong className="block mb-3 text-lg text-amber-900">
                  The Family Legacy Plan - $79/year (Launch Special)
                </strong>
                <p className="text-sm text-amber-800 mb-3">Regular price: $99/year</p>
                <ul className="space-y-2 ml-0 text-base">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-heritage-coral mt-1 flex-shrink-0" />
                    <span>Unlimited story recordings</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-heritage-coral mt-1 flex-shrink-0" />
                    <span>Automatic transcription</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-heritage-coral mt-1 flex-shrink-0" />
                    <span>Timeline, Living Book & Memory Box</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-heritage-coral mt-1 flex-shrink-0" />
                    <span>Share with unlimited family members</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-heritage-coral mt-1 flex-shrink-0" />
                    <span>Secure cloud storage</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-5 mt-3">
                <strong className="block mb-3 text-lg">
                  Free Trial
                </strong>
                <ul className="space-y-2 ml-0 text-base">
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-heritage-coral mt-1 flex-shrink-0" />
                    <span>Try your first 3 stories completely free</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-heritage-coral mt-1 flex-shrink-0" />
                    <span>Access all features to test the experience</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-heritage-coral mt-1 flex-shrink-0" />
                    <span>No credit card required to start</span>
                  </li>
                </ul>
              </div>
            </div>
          ),
          icon: <DollarSign className="w-5 h-5" />,
        },
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
      title: "Family",
      items: [
        {
          question: "How does my family listen to my stories?",
          answer: (
            <div className="space-y-4">
              <p className="text-base">Once you invite family members:</p>
              <ul className="list-none space-y-3 ml-0 text-base">
                <li>They'll receive a sign-in link by email</li>
                <li>They tap the link to access your stories</li>
                <li>They can read your stories AND hear them in your voice</li>
                <li>They can view from anywhere in the world</li>
              </ul>
              <p className="text-base mt-3">
                You stay in control - only people you invite can see your memories.
              </p>
            </div>
          ),
          icon: <HelpCircle className="w-5 h-5" />,
        },
        {
          question: "Can my family help me record?",
          answer: (
            <div className="space-y-4">
              <p className="text-base"><strong>Absolutely!</strong> A family member can:</p>
              <ul className="list-none space-y-3 ml-0 text-base">
                <li>Sit with you and tap the buttons while you talk</li>
                <li>Help you choose photos to add</li>
                <li>Type stories for you if you prefer not to record</li>
                <li>Ask you questions to help spark memories</li>
              </ul>
              <p className="text-base mt-3">
                Many families make it a weekly activity together.
              </p>
            </div>
          ),
          icon: <HelpCircle className="w-5 h-5" />,
        },
        {
          question: "Can my children or grandchildren add their own memories?",
          answer: (
            <div className="space-y-4">
              <p className="text-base">Currently, each account has one storyteller. But you can:</p>
              <ul className="list-none space-y-3 ml-0 text-base">
                <li>Invite family to view and listen to your stories</li>
                <li>Have family members create their own Heritage Whisper account to record their memories</li>
                <li>Record stories about your children and grandchildren in your own account</li>
              </ul>
            </div>
          ),
          icon: <HelpCircle className="w-5 h-5" />,
        },
      ],
    },
    {
      title: "Memory & Photos",
      items: [
        {
          question: "What kinds of stories should I record?",
          answer: (
            <div className="space-y-4">
              <p className="text-base">Anything that matters to you! Some ideas:</p>
              <ul className="list-none space-y-2 ml-0 text-base">
                <li>How you met your spouse</li>
                <li>Your first job or career memories</li>
                <li>Favorite family vacations</li>
                <li>Holiday traditions and recipes</li>
                <li>Lessons you learned the hard way</li>
                <li>Funny moments with your kids</li>
                <li>What life was like when you were young</li>
                <li>Advice you'd give to your grandchildren</li>
              </ul>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-base">
                  💡 <strong>Tip:</strong> Tap "Menu" → "Story Ideas" for personalized prompts to help you get started.
                </p>
              </div>
            </div>
          ),
          icon: <ImageIcon className="w-5 h-5" />,
        },
        {
          question: "I have old photos. Can I add them?",
          answer: (
            <div className="space-y-4">
              <p className="text-base"><strong>Yes!</strong> You can add photos to any memory:</p>
              <ul className="list-none space-y-3 ml-0 text-base">
                <li>
                  <strong>Printed photos:</strong> Take a picture of them with your phone or tablet, then upload
                </li>
                <li>
                  <strong>Digital photos:</strong> Upload directly from your device
                </li>
                <li>
                  <strong>Photo albums:</strong> Snap pictures of album pages to capture multiple photos
                </li>
              </ul>
              <p className="text-base mt-3">
                Each memory can have as many photos as you want.
              </p>
            </div>
          ),
          icon: <ImageIcon className="w-5 h-5" />,
        },
        {
          question: "What's the difference between Stories and Treasures in Memory Box?",
          answer: (
            <div className="space-y-4">
              <ul className="list-none space-y-3 ml-0 text-base">
                <li>
                  <strong>Stories:</strong> Your recorded or typed memories with photos
                </li>
                <li>
                  <strong>Treasures:</strong> Special keepsakes like recipes, documents, heirlooms, and memorabilia that you want to preserve with a story behind them
                </li>
              </ul>
              <p className="text-base mt-3">
                Both appear in your Book and Timeline!
              </p>
            </div>
          ),
          icon: <ImageIcon className="w-5 h-5" />,
        },
      ],
    },
    {
      title: "Privacy & Trust",
      items: [
        {
          question: "Who can see my stories?",
          answer: (
            <div className="space-y-4">
              <p className="text-base">Only the people you choose:</p>
              <ul className="list-none space-y-3 ml-0 text-base">
                <li>
                  <strong>Private by default:</strong> Your stories are only visible to you until you invite family
                </li>
                <li>
                  <strong>You control access:</strong> Invite specific family members through the Family page
                </li>
                <li>
                  <strong>Nothing is public:</strong> Your stories never appear on the internet for strangers to see
                </li>
                <li>
                  <strong>Remove access anytime:</strong> You can uninvite anyone at any time
                </li>
              </ul>
            </div>
          ),
          icon: <HelpCircle className="w-5 h-5" />,
        },
        {
          question: "What happens to my stories if something happens to me?",
          answer: (
            <div className="space-y-4">
              <p className="text-base">Your stories live on for your family:</p>
              <ul className="list-none space-y-3 ml-0 text-base">
                <li>Family members you've invited will continue to have access</li>
                <li>Your stories, voice recordings, and photos are preserved</li>
                <li>Consider inviting a trusted family member now so they have access</li>
              </ul>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-base">
                  💡 <strong>Tip:</strong> Let a family member know about your Heritage Whisper account and how to access it.
                </p>
              </div>
            </div>
          ),
          icon: <HelpCircle className="w-5 h-5" />,
        },
        {
          question: "Is my information safe?",
          answer: (
            <div className="space-y-4">
              <p className="text-base"><strong>Yes.</strong> We take your privacy seriously:</p>
              <ul className="list-none space-y-3 ml-0 text-base">
                <li>All your data is encrypted and stored securely</li>
                <li>We automatically remove location data from your photos</li>
                <li>We never sell or share your information</li>
                <li>You can download all your data anytime</li>
                <li>You can delete your account anytime</li>
              </ul>
            </div>
          ),
          icon: <HelpCircle className="w-5 h-5" />,
        },
        {
          question: "How do I delete my account?",
          answer: (
            <div className="space-y-3">
              <p className="text-base">
                We hope you'll stay, but if you need to delete your account:
              </p>
              <ol className="list-none space-y-2 ml-0 text-base">
                <li>
                  <strong>Step 1:</strong> Tap <strong>Menu</strong> → <strong>Settings</strong>
                </li>
                <li>
                  <strong>Step 2:</strong> Scroll down to <strong>Danger Zone</strong>
                </li>
                <li>
                  <strong>Step 3:</strong> Tap <strong>"Delete Account"</strong>
                </li>
                <li>
                  <strong>Step 4:</strong> Confirm the deletion (this cannot be undone)
                </li>
              </ol>
              <p className="text-base text-red-600 mt-3">
                ⚠️ <strong>Warning:</strong> This permanently deletes all your memories, photos, and audio recordings. Consider exporting your data first using the "Export All Data" option in the Data & Privacy section above.
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
