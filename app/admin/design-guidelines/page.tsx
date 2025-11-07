"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Palette } from "lucide-react";

export default function DesignGuidelinesPage() {
  return (
    <div className="min-h-screen bg-[#FFF8F3] py-8 px-4 pt-20 lg:pt-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Palette className="w-8 h-8 text-heritage-coral" />
            <h1 className="text-4xl font-serif font-bold text-heritage-brown">
              Design Guidelines
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Senior-first accessibility standards and design tokens
          </p>
        </div>

        {/* Summary */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-700 leading-relaxed">
            <p>
              Raise base text to <strong>18px</strong>, lock contrast, enlarge and separate targets, keep labels visible, and add a "Simple Mode" preset.
              Ship bottom tabs with icon + label, inputs at <strong>56px</strong>, skeletons everywhere, and proxy/caregiver patterns.
              The rest is editing, not inventing.
            </p>
          </CardContent>
        </Card>

        {/* High-Impact Fixes */}
        <Card>
          <CardHeader>
            <CardTitle>High-Impact Fixes to Apply Now</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-600">
              <strong>Base type:</strong> make body 18px default. Keep 16px only for captions/labels.
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-600">
              <strong>Contrast:</strong> change brand buttons to blue-600 with white text, not blue-500.
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-600">
              <strong>Status colors:</strong> switch success/error to darker tones so white text passes AA.
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-red-600">
              <strong>Grays:</strong> never use gray-400 on white for content. Reserve it for disabled only.
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-600">
              <strong>Targets & spacing:</strong> primary actions 60px tall, all controls ≥48px, 16–24px spacing between tappables.
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-600">
              <strong>Line length:</strong> cap reading width to 60–75 characters (max-w-[65ch]).
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-600">
              <strong>Nav:</strong> 4 tabs max, icon + label always visible, label ≥14px.
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-600">
              <strong>Inputs:</strong> 56px field height, inline validation, right keyboard per field.
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-600">
              <strong>Scaling:</strong> support 200% text scale and iOS AX sizes; no caps. Ensure scroll containers prevent cut-offs.
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border-l-4 border-green-600">
              <strong>Simple Mode:</strong> larger type and fewer choices per screen; user-toggle in Settings.
            </div>
          </CardContent>
        </Card>

        {/* Token Tweaks */}
        <Card>
          <CardHeader>
            <CardTitle>Token Tweaks (Drop-in Replacements)</CardTitle>
            <CardDescription>Use these so all CTA text is AA at any size</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-900 rounded-lg text-white font-mono text-xs overflow-x-auto">
              <pre>{`:root {
  /* Brand */
  --primary: #2563EB;      /* blue-600 (AA with white) */
  --primary-hover: #1D4ED8; /* blue-700 */

  /* Text */
  --text-primary: #111827;   /* gray-900 */
  --text-secondary: #6B7280; /* gray-500 (OK ≥16px) */
  --text-tertiary: #9CA3AF;  /* disabled/meta only, not body */

  /* Backgrounds */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F9FAFB;
  --border: #E5E7EB;

  /* Status (AA with white) */
  --success: #15803D;     /* green-700 */
  --error: #DC2626;       /* red-600 */
  --warning-bg: #FFFBEB;  /* amber-50 */
  --warning-accent: #B45309; /* amber-700 if on dark */

  /* Sizing */
  --body: 18px;           /* default body */
  --line: 1.5;
  --hit-min: 48px;
  --hit-pref: 60px;
  --gap: 16px;            /* inter-control spacing minimum */
}
html { font-size: var(--body); }`}</pre>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="font-semibold mb-2">Brand Colors</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded" style={{ backgroundColor: '#2563EB' }}></div>
                    <code className="text-xs">--primary: #2563EB</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded" style={{ backgroundColor: '#1D4ED8' }}></div>
                    <code className="text-xs">--primary-hover: #1D4ED8</code>
                  </div>
                </div>
              </div>

              <div>
                <div className="font-semibold mb-2">Status Colors</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded" style={{ backgroundColor: '#15803D' }}></div>
                    <code className="text-xs">--success: #15803D</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded" style={{ backgroundColor: '#DC2626' }}></div>
                    <code className="text-xs">--error: #DC2626</code>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tailwind Class Upgrades */}
        <Card>
          <CardHeader>
            <CardTitle>Tailwind Class Upgrades (Exact Swaps)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Primary Button */}
            <div>
              <div className="font-semibold mb-3">Primary Button</div>
              <button className="w-full min-h-[60px] px-8 py-4 bg-blue-600 text-white text-lg font-medium rounded-xl shadow-sm hover:shadow-md hover:bg-blue-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 focus:ring-offset-white transition-all duration-200">
                Example Primary Button
              </button>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <pre className="text-xs overflow-x-auto">{`w-full min-h-[60px] px-8 py-4
bg-blue-600 text-white text-lg font-medium
rounded-xl shadow-sm hover:shadow-md hover:bg-blue-700
active:scale-[0.98] focus:outline-none
focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 focus:ring-offset-white
transition-all duration-200`}</pre>
              </div>
            </div>

            {/* Secondary Button */}
            <div>
              <div className="font-semibold mb-3">Secondary Button</div>
              <button className="w-full min-h-[48px] px-6 py-3 bg-white text-gray-900 text-base font-medium border border-gray-200 rounded-xl hover:bg-gray-50 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all duration-200">
                Example Secondary Button
              </button>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <pre className="text-xs overflow-x-auto">{`w-full min-h-[48px] px-6 py-3
bg-white text-gray-900 text-base font-medium
border border-gray-200 rounded-xl
hover:bg-gray-50 active:scale-[0.98]
focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600
transition-all duration-200`}</pre>
              </div>
            </div>

            {/* Input */}
            <div>
              <div className="font-semibold mb-3">Input / Select / Textarea</div>
              <input
                type="text"
                placeholder="Example input field"
                className="h-14 w-full px-4 py-3 text-base bg-white border border-gray-300 rounded-xl placeholder:text-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0"
              />
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <pre className="text-xs overflow-x-auto">{`h-14 w-full px-4 py-3 text-base
bg-white border border-gray-300 rounded-xl
placeholder:text-gray-400
focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0
aria-[invalid=true]:border-red-600`}</pre>
              </div>
            </div>

            {/* Cards */}
            <div>
              <div className="font-semibold mb-3">Card (pick one per page)</div>
              <div className="space-y-4">
                <div>
                  <div className="text-sm mb-2">Border style:</div>
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="text-sm text-gray-600">Content here</div>
                  </div>
                  <code className="text-xs mt-2 block">bg-white border border-gray-200 rounded-xl p-6</code>
                </div>
                <div>
                  <div className="text-sm mb-2">OR Shadow style:</div>
                  <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
                    <div className="text-sm text-gray-600">Content here</div>
                  </div>
                  <code className="text-xs mt-2 block">bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6</code>
                </div>
              </div>
            </div>

            {/* Bottom Tab */}
            <div>
              <div className="font-semibold mb-3">Bottom Tab Item</div>
              <div className="flex gap-2 bg-gray-100 p-2 rounded-lg">
                <div className="flex flex-col items-center justify-center min-w-[72px] h-16 text-sm text-blue-600">
                  <div className="mb-1">🏠</div>
                  <div>Home</div>
                </div>
                <div className="flex flex-col items-center justify-center min-w-[72px] h-16 text-sm text-gray-500">
                  <div className="mb-1">📖</div>
                  <div>Stories</div>
                </div>
              </div>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <pre className="text-xs overflow-x-auto">{`flex flex-col items-center justify-center
min-w-[72px] h-16
text-sm
aria-[current=true]:text-blue-600`}</pre>
              </div>
              <div className="mt-2 p-2 bg-amber-50 border-l-4 border-amber-400 text-xs text-amber-800">
                Always show icon + label. No icon-only tabs.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content & Layout Guardrails */}
        <Card>
          <CardHeader>
            <CardTitle>Content & Layout Guardrails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><strong>Headings:</strong> text-2xl to text-4xl, 1.5 line height.</div>
            <div><strong>Body:</strong> text-base → md:text-lg.</div>
            <div><strong>Readable width:</strong> wrap long text in max-w-[65ch].</div>
            <div><strong>White space:</strong> use only 8-point steps; between tappables use gap-4 or gap-6.</div>
            <div><strong>Copy:</strong> verb-first CTAs, 6–8 words max. No jargon.</div>
          </CardContent>
        </Card>

        {/* Page-Specific Specs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recording Screen */}
          <Card>
            <CardHeader>
              <CardTitle>Recording Screen (Tight Spec)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>• Timer text-5xl font-semibold, near-black on white.</div>
              <div>• One primary button: Record (blue-600).</div>
              <div>• Tap to pause/resume. No long-press.</div>
              <div>• Subtle single pulse: animate-pulse opacity-30 under the mic icon only.</div>
              <div>• Helper text: "Take your time. You can edit later."</div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>• Grid/list cards with consistent gap-6.</div>
              <div>• Year markers prominent, text-xl font-semibold.</div>
              <div>• Wisdom/Lessons use amber-50 background with black text and left border amber-400.</div>
              <div>• Card actions as 60px buttons with labels: Play, Share, Print.</div>
            </CardContent>
          </Card>

          {/* Story Ideas */}
          <Card>
            <CardHeader>
              <CardTitle>Story Ideas / Prompts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>• Each prompt has a Record button.</div>
              <div>• Categories as labeled chips, 32+ px tall.</div>
              <div>• If you keep a purple-blue gradient, limit to the hero and ensure text 4.5:1.</div>
              <div>• Progressive disclosure: collapsed by default, expand for details.</div>
            </CardContent>
          </Card>
        </div>

        {/* Accessibility Specifics */}
        <Card>
          <CardHeader>
            <CardTitle>Accessibility Specifics to Add</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>• Respect Bold Text, Reduce Motion, Increase Contrast.</div>
            <div>• VoiceOver/TalkBack: every control has role, name, state.</div>
            <div>• Text scaling: test iOS AX3–AX5 and Android at 200%; no clipped controls; scroll instead.</div>
            <div>• Focus styles: always visible (focus:ring-2 focus:ring-blue-600 focus:ring-offset-2).</div>
            <div>• Never rely on color alone; pair with icons and text.</div>
          </CardContent>
        </Card>

        {/* Proxy & Simple Mode */}
        <Card>
          <CardHeader>
            <CardTitle>Proxy & Simple Mode (Add to System)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><strong>Proxy/Caregiver:</strong> invite by link → role selection (view, assist) → audit trail.</div>
            <div><strong>Simple Mode:</strong> larger type preset, fewer tabs, fewer actions per screen. Toggle in Settings, remember per user.</div>
          </CardContent>
        </Card>

        {/* QA Checklist */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle>QA Checklist (Ship Gate)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span>Body text ≥18px; captions only may be 16px.</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span>All tappables ≥48px; primaries ≥60px; 16–24px between tappables.</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span>Blue buttons are blue-600+; success/error use the darker tokens above.</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span>Contrast AA passes in light and dark.</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span>Icon + label on tabs; ≤4 items.</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span>Inputs are 56px tall with inline validation.</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span>Skeletons replace spinners for content lists.</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span>Full flows usable at 200%/AX5 with screen readers on.</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Why These Edits Matter */}
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle>Why These Edits Matter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <div>• <strong>Blue-600</strong> fixes contrast so your white CTA text is readable at any size.</div>
            <div>• <strong>Darker success/error colors</strong> prevent failure states that look "fine" to us but unreadable to seniors.</div>
            <div>• <strong>18px base body + 56/60px controls</strong> materially reduce mis-taps and rereads.</div>
            <div>• <strong>Max line length and visible labels</strong> speed comprehension and cut errors.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
