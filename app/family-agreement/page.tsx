"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  Shield, 
  Heart, 
  Users, 
  Bot, 
  DollarSign, 
  Scale,
  Lock,
  PhoneCall,
  FileText,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { LeftSidebar } from "@/components/LeftSidebar";
import { useMediaQuery } from "@/hooks/use-media-query";
import { DesktopPageHeader, MobilePageHeader } from "@/components/PageHeader";

// Prevent static generation for this page
export const dynamic = 'force-dynamic';

export default function FamilyAgreement() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [isDark, setIsDark] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

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

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: isDark ? "#1c1c1d" : "#FFF8F3" }}>
      {/* Desktop Header */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <DesktopPageHeader
          icon={Heart}
          title="Family Agreement"
          subtitle="Our promises to you and your family"
        />
        <MobilePageHeader
          icon={Heart}
          title="Family Agreement"
          subtitle="Our promises to you"
        />
      </div>

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

      {/* Main content */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0 lg:ml-56" style={{ marginTop: 55 }}>
        <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          
          {/* Welcome Header */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              HeritageWhisper Family Agreement
            </h1>
            <p className="text-lg text-gray-600 mb-2">Effective Date: November 1, 2025</p>
            <div className="mt-6 p-6 bg-coral-50 rounded-lg">
              <p className="text-lg text-gray-800 mb-4">
                Dear Friend,<br/>
                Welcome to HeritageWhisper. This agreement explains our promises to you and your family.<br/>
                We've kept it simple - the important parts are up front, legal details are at the end.
              </p>
              <div className="text-center text-sm">
                <p className="font-semibold">Need help understanding anything?</p>
                <p>Email us: <a href="mailto:support@heritagewhisper.com" className="text-coral-600 hover:underline">support@heritagewhisper.com</a></p>
              </div>
            </div>
          </div>

          {/* Section 1: Legacy */}
          <section className="mb-8">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-purple-50 to-purple-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-purple-200 rounded-full">
                    <Heart className="w-6 h-6 text-purple-700" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    When You're Gone, Your Stories Live On
                  </h2>
                </div>
                <p className="text-lg text-gray-800 font-semibold">
                  Your stories belong to your family forever. Here's our promise:
                </p>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Setting Up Your Legacy:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>Name someone to inherit your account (spouse, child, friend - your choice)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>Takes 2 minutes in Settings → Legacy Contact</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>Change it anytime</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">When the Time Comes:</h3>
                  <p className="mb-2">Your chosen person just needs to:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>Send us a death certificate</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>Show their ID</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>We'll transfer everything within 7 days</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">No Legacy Contact Set?</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>We'll keep your stories safe for 5 years</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>Your family can claim them with proper documents</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>After 5 years, we must delete unclaimed accounts</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm">
                    💡 <strong>Tip:</strong> Tell your Legacy Contact now. Don't make them guess.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Ownership */}
          <section className="mb-8">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-200 rounded-full">
                    <FileText className="w-6 h-6 text-blue-700" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Your Stories Are YOURS
                  </h2>
                </div>
                <p className="text-lg text-gray-800 font-semibold">
                  Simple Truth: You own every word, every photo, every memory.
                </p>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">What you own:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>All your recordings</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>All your photos</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>All your stories</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Everything you create here</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">What we can do:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Store it safely</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Help you share with family</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Create transcriptions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Generate questions to help you remember more</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Make backups so nothing gets lost</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">What we'll NEVER do:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="text-red-600">✗</span>
                      <span>Sell your stories</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-600">✗</span>
                      <span>Share without permission</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-600">✗</span>
                      <span>Use your stories to train computers</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-600">✗</span>
                      <span>Claim ownership</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-semibold">
                    Want to leave? Download everything and go. It's all yours.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Storyteller */}
          <section className="mb-8">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-green-50 to-green-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-200 rounded-full">
                    <Bot className="w-6 h-6 text-green-700" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Your Storyteller Features
                  </h2>
                </div>
                <p className="text-gray-800">
                  Think of Storyteller like a helpful librarian who:
                </p>
              </div>
              
              <div className="p-6 space-y-6">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Writes down what you say (transcription)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Suggests questions to help you remember more</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Never judges or shares your stories</span>
                  </li>
                </ul>

                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="font-semibold mb-2">Is a human listening?</p>
                  <p>No. Only computers process your recordings.</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Common Concerns:</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold mb-2">"Will Storyteller get my story wrong?"</p>
                      <p className="mb-2">Sometimes it makes mistakes with:</p>
                      <ul className="space-y-1 ml-4">
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">•</span>
                          <span>Unusual names (it might write "John" instead of "Jean")</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">•</span>
                          <span>Heavy accents or whispered words</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-600 mt-1">•</span>
                          <span>Background noise</span>
                        </li>
                      </ul>
                      <p className="mt-2">That's why you can always fix the transcription yourself.</p>
                    </div>

                    <div>
                      <p className="font-semibold mb-2">"Is my story being used to train computers?"</p>
                      <p>Absolutely not. Your stories are processed to help YOU, then forgotten.</p>
                    </div>

                    <div className="p-4 bg-gray-100 rounded-lg">
                      <p className="font-semibold mb-2">Want to turn off Storyteller features?</p>
                      <p>Settings → Privacy → Disable "Enable Storyteller Features"</p>
                      <p className="text-sm text-gray-600">(You can still type stories manually)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Beta Phase */}
          <section className="mb-8">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-amber-50 to-amber-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-amber-200 rounded-full">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    We're in Beta (Growing Together)
                  </h2>
                </div>
                <p className="text-gray-800">
                  <strong>What "Beta" means in plain English:</strong><br/>
                  We're like a new restaurant that's still perfecting recipes. The food is good, but we're still learning.
                </p>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">What might happen:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>New features appear (usually good!)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>Some features change or disappear</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>Occasional hiccups or slow moments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>You might spot a bug (tell us - we'll fix it!)</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-amber-50 rounded-lg">
                  <p className="font-semibold">Your stories are always safe.</p>
                  <p>Beta doesn't mean risky - it means improving.</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Want to help?</h3>
                  <p className="mb-2">Beta users who send feedback get:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>First access to new features</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>Direct line to our team</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-1">•</span>
                      <span>Knowing you helped build something special</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Pricing */}
          <section className="mb-8">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-coral-50 to-coral-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-coral-200 rounded-full">
                    <DollarSign className="w-6 h-6 text-coral-700" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Pricing That Respects Seniors
                  </h2>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 border-2 border-green-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Free Forever Plan:</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>3 complete stories with all features</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>Perfect for trying us out</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>No credit card needed</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 border-2 border-coral-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Premium: $149/year
                      <span className="text-sm font-normal text-gray-600 block">(that's $12.42/month)</span>
                    </h3>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-coral-600 mt-1">•</span>
                        <span>Unlimited stories</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-coral-600 mt-1">•</span>
                        <span>Share with 5 family members</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-coral-600 mt-1">•</span>
                        <span>Print annual book</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-coral-600 mt-1">•</span>
                        <span>Download everything anytime</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="p-6 bg-coral-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Senior Safeguards:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span><strong>60-day money back</strong> (double the standard)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span><strong>Reminder email AND letter</strong> before renewal</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span><strong>Add a family member</strong> to get billing alerts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span><strong>Cancel anytime</strong> via settings or email</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span><strong>Pause anytime</strong> if you need a break</span>
                    </li>
                  </ul>
                  
                  <div className="mt-4 p-3 bg-white rounded">
                    <p className="text-sm">
                      <strong>Worried about accidental charges?</strong><br/>
                      Email us. We're humans. We'll work it out.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Problem Resolution */}
          <section className="mb-8">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-indigo-50 to-indigo-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-indigo-200 rounded-full">
                    <Scale className="w-6 h-6 text-indigo-700" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Solving Problems Together
                  </h2>
                </div>
                <p className="text-gray-800">
                  If you have a problem, here's what happens:
                </p>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="space-y-6">
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 1: Just tell us</h3>
                    <ul className="space-y-1">
                      <li>• Email: support@heritagewhisper.com</li>
                      <li>• We solve 95% of issues this way</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 2: If we can't agree</h3>
                    <ul className="space-y-1">
                      <li>• We'll try mediation (neutral person helps)</li>
                      <li>• You choose: Phone, video, or in-person</li>
                      <li>• We pay the mediator</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Step 3: Last resort</h3>
                    <ul className="space-y-1">
                      <li>• Arbitration (like court, but faster and cheaper)</li>
                      <li>• You can choose your state or Washington</li>
                      <li>• We pay all fees except filing fee</li>
                      <li>• OR use small claims court (your choice)</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Your rights:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 mt-1">•</span>
                      <span>Opt out of arbitration within 30 days</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 mt-1">•</span>
                      <span>Join with other users for group issues</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 mt-1">•</span>
                      <span>Keep all consumer protection rights</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-indigo-100 rounded-lg">
                  <p className="font-semibold">Our promise:</p>
                  <p>We'd rather fix problems than fight about them.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7: Privacy */}
          <section className="mb-8">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gray-200 rounded-full">
                    <Lock className="w-6 h-6 text-gray-700" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Your Privacy, Protected
                  </h2>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Who sees your stories?</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-gray-600 mt-1">•</span>
                      <span>You</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-600 mt-1">•</span>
                      <span>People you specifically invite</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-600 mt-1">•</span>
                      <span>That's it</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Emergency exceptions:</h3>
                  <p className="mb-2">We might have to share if:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-gray-600 mt-1">•</span>
                      <span>Court orders us (very rare)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-600 mt-1">•</span>
                      <span>Someone's in immediate danger</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-600 mt-1">•</span>
                      <span>You ask us to</span>
                    </li>
                  </ul>
                  <p className="mt-3">We'll always tell you if this happens (unless legally forbidden).</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 8: Family Sharing */}
          <section className="mb-8">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-teal-50 to-teal-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-teal-200 rounded-full">
                    <Users className="w-6 h-6 text-teal-700" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Family Sharing (How It Works)
                  </h2>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="p-4 bg-gray-100 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">If You Have Free Account:</h3>
                  <p>You can share individual stories with family (they get a link that expires in 48 hours)</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">If You Have Premium:</h3>
                  <p className="mb-3">You can invite up to 5 family members as:</p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold mb-2">Viewers - They can:</h4>
                      <ul className="space-y-1">
                        <li>• See stories you share</li>
                        <li>• Leave comments</li>
                        <li>• Download what you allow</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold mb-2">Collaborators - They can also:</h4>
                      <ul className="space-y-1">
                        <li>• Add their own stories</li>
                        <li>• Upload photos</li>
                        <li>• Build the timeline together</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-teal-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Important: Each person owns their own stories</h3>
                  <ul className="space-y-1">
                    <li>• You can't delete what others create</li>
                    <li>• They can't delete what you create</li>
                    <li>• If someone leaves, they choose if their stories stay</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 9: Don't Do These */}
          <section className="mb-8">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-red-50 to-red-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-red-200 rounded-full">
                    <span className="text-2xl">🚫</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Please Don't Do These Things
                  </h2>
                </div>
                <p className="text-gray-800">
                  We built HeritageWhisper with love. Please don't:
                </p>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Break the Law:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">•</span>
                      <span>Upload illegal content</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">•</span>
                      <span>Violate copyrights</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">•</span>
                      <span>Harass anyone</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Abuse Our Service:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">•</span>
                      <span>Create fake accounts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">•</span>
                      <span>Try to hack or break things</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">•</span>
                      <span>Scrape or steal data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">•</span>
                      <span>Use bots or automation</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Hurt Others:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">•</span>
                      <span>Pressure elderly users</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">•</span>
                      <span>Share private information without permission</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">•</span>
                      <span>Impersonate someone</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">•</span>
                      <span>Use our service for scams</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="font-semibold">If you do:</p>
                  <p>We'll have to close your account. In serious cases, we'll contact authorities.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 10: Company Info */}
          <section className="mb-8">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-slate-200 rounded-full">
                    <span className="text-2xl">🏛️</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    The Legal Company Stuff
                  </h2>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Who We Are:</h3>
                  <p>Heritage Whisper LLC<br/>
                  A Washington State company<br/>
                  522 W Riverside Ave, Suite N<br/>
                  Spokane, WA 99201</p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">What We Own:</h3>
                  <ul className="space-y-1">
                    <li>• The HeritageWhisper name and logo</li>
                    <li>• Our website and app code</li>
                    <li>• The way everything looks and works</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">What We Don't Own:</h3>
                  <ul className="space-y-1">
                    <li>• Your stories (those are yours!)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Using Our Service:</h3>
                  <p>When you use HeritageWhisper, you can't:</p>
                  <ul className="space-y-1 mt-2">
                    <li>• Resell it</li>
                    <li>• Copy our design</li>
                    <li>• Remove our branding</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 11: Legal Details (Collapsible) */}
          <section className="mb-8">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => toggleSection('legal')}
                className="w-full p-6 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gray-200 rounded-full">
                      <FileText className="w-6 h-6 text-gray-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      The Detailed Legal Terms
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {openSections.legal ? 'Click to hide' : 'Click to expand'}
                    </span>
                    {openSections.legal ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                </div>
              </button>
              
              {openSections.legal && (
                <div className="p-6 bg-gray-50 space-y-6">
                  <div className="p-4 bg-yellow-100 border-2 border-yellow-300 rounded-lg">
                    <p className="font-semibold">⚠️ Warning: Lawyer language ahead!</p>
                    <p className="text-sm">This section contains the legal details our lawyers require. It's the same information from above, just in formal language.</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Age Requirements</h3>
                      <ul className="list-disc list-inside space-y-1">
                        <li>You must be 18 or older to create an account</li>
                        <li>Ages 13-17 need parental consent</li>
                        <li>We don't knowingly collect data from children under 13</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Requirements</h3>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Provide accurate information</li>
                        <li>Keep your password secure</li>
                        <li>One account per person</li>
                        <li>You're responsible for all account activity</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Availability</h3>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Currently US-only (no EU/UK service)</li>
                        <li>Requires internet connection</li>
                        <li>Works on phones and computers</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Terms</h3>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Premium: $149/year (billed annually)</li>
                        <li>Processed by Stripe</li>
                        <li>Auto-renews unless cancelled</li>
                        <li>60-day money-back guarantee</li>
                        <li>Price changes: 30 days notice</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Content License</h3>
                      <p className="mb-2">By uploading content, you grant Heritage Whisper LLC a limited, non-exclusive, worldwide license to:</p>
                      <ul className="list-disc list-inside space-y-1 mb-2">
                        <li>Store and backup your content</li>
                        <li>Process through AI services</li>
                        <li>Display to authorized users</li>
                        <li>Create derivatives (transcriptions)</li>
                      </ul>
                      <p className="text-sm text-gray-600">This license ends when you delete content (except backups retained for 30 days).</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Interruptions</h3>
                      <p className="mb-2">We don't guarantee 100% uptime. Service may be unavailable due to:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Maintenance</li>
                        <li>Technical issues</li>
                        <li>Third-party outages</li>
                        <li>Events beyond our control</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Limitation of Liability</h3>
                      <p className="uppercase font-bold mb-2">TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR LIABILITY IS LIMITED TO THE AMOUNT YOU PAID IN THE PAST 12 MONTHS OR $149, WHICHEVER IS GREATER.</p>
                      <p>WE PROVIDE THE SERVICE "AS IS" WITHOUT WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Indemnification</h3>
                      <p>You agree to defend and hold harmless Heritage Whisper LLC from claims arising from your use of the service or violation of these terms.</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Termination</h3>
                      <p className="mb-2">Either party may terminate:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>You: Anytime via settings or email</li>
                        <li>Us: For terms violations or non-payment</li>
                        <li>Effect: Immediate access loss, 30-day data retention</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Governing Law</h3>
                      <p>These terms are governed by Washington State law. Disputes are subject to binding arbitration (AAA Consumer Rules) with opt-out available within 30 days.</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Changes to Terms</h3>
                      <p className="mb-2">We may update these terms with notice via:</p>
                      <ul className="list-disc list-inside space-y-1 mb-2">
                        <li>Email</li>
                        <li>Website banner</li>
                        <li>In-app notification</li>
                      </ul>
                      <p className="text-sm text-gray-600">Continued use = acceptance.</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Additional Legal Terms</h3>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>Severability:</strong> If any provision is invalid, the rest remain in effect</li>
                        <li><strong>Assignment:</strong> You cannot transfer your account. We may assign in connection with business changes</li>
                        <li><strong>Entire Agreement:</strong> This Agreement and our Privacy Policy constitute the entire agreement</li>
                        <li><strong>No Waiver:</strong> Our failure to enforce any right doesn't waive that right</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Contact Section */}
          <section className="mb-8">
            <div className="bg-gradient-to-r from-coral-50 to-coral-100 rounded-lg shadow-sm p-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Questions? We're Here to Help!
              </h2>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">💬 General Support:</h3>
                  <p className="text-sm">support@heritagewhisper.com</p>
                </div>
                
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">⚖️ Legal Questions:</h3>
                  <p className="text-sm">legal@heritagewhisper.com</p>
                </div>
                
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">🔒 Privacy Concerns:</h3>
                  <p className="text-sm">privacy@heritagewhisper.com</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 inline-block">
                <h3 className="font-semibold text-gray-900 mb-2">✉️ Mail:</h3>
                <p className="text-sm">
                  Heritage Whisper LLC<br/>
                  522 W Riverside Ave, Suite N<br/>
                  Spokane, WA 99201
                </p>
              </div>
            </div>
          </section>

          {/* Final Agreement */}
          <section className="mb-8">
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Your Agreement
              </h2>
              <p className="text-lg text-gray-700 mb-4">
                By using HeritageWhisper, you're agreeing to this Family Agreement.<br/>
                If something doesn't feel right, please don't use our service - but do tell us what concerns you!
              </p>
              <p className="text-xl font-semibold text-coral-600">
                Thank you for trusting us with your family's stories.
              </p>
              
              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Version 1.0 - November 1, 2025<br/>
                  Previous version: October 4, 2025
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
