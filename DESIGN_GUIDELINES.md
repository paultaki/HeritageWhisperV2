Summary

Raise base text to 18 px, lock contrast, enlarge and separate targets, keep labels visible, and add a “Simple Mode” preset. Ship bottom tabs with icon + label, inputs at 56 px, skeletons everywhere, and proxy/caregiver patterns. The rest is editing, not inventing.

High-impact fixes to apply now

Base type: make body 18 px default. Keep 16 px only for captions/labels.

Contrast: change brand buttons to blue-600 with white text, not blue-500.

Status colors: switch success/error to darker tones so white text passes AA.

Grays: never use gray-400 on white for content. Reserve it for disabled only.

Targets & spacing: primary actions 60 px tall, all controls ≥48 px, 16–24 px spacing between tappables.

Line length: cap reading width to 60–75 characters (max-w-[65ch]).

Nav: 4 tabs max, icon + label always visible, label ≥14 px.

Inputs: 56 px field height, inline validation, right keyboard per field.

Scaling: support 200% text scale and iOS AX sizes; no caps. Ensure scroll containers prevent cut-offs.

Simple Mode: larger type and fewer choices per screen; user-toggle in Settings.

Token tweaks (drop-in replacements)

Use these so all CTA text is AA at any size.

:root{
  /* Brand */
  --primary: #2563EB;     /* blue-600 (AA with white) */
  --primary-hover: #1D4ED8;/* blue-700 */

  /* Text */
  --text-primary: #111827; /* gray-900 */
  --text-secondary: #6B7280;/* gray-500 (OK ≥16 px) */
  --text-tertiary: #9CA3AF; /* disabled/meta only, not body */

  /* Backgrounds */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F9FAFB;
  --border: #E5E7EB;

  /* Status (AA with white) */
  --success: #15803D;    /* green-700 */
  --error: #DC2626;      /* red-600 */
  --warning-bg: #FFFBEB; /* amber-50 */
  --warning-accent: #B45309; /* amber-700 if on dark */

  /* Sizing */
  --body: 18px;          /* default body */
  --line: 1.5;
  --hit-min: 48px;
  --hit-pref: 60px;
  --gap: 16px;           /* inter-control spacing minimum */
}
html{ font-size: var(--body); }

Tailwind class upgrades (exact swaps)

Primary Button
Replace your button classes with:

w-full min-h-[60px] px-8 py-4
bg-blue-600 text-white text-lg font-medium
rounded-xl shadow-sm hover:shadow-md hover:bg-blue-700
active:scale-[0.98] focus:outline-none
focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 focus:ring-offset-white
transition-all duration-200


Secondary Button

w-full min-h-[48px] px-6 py-3
bg-white text-gray-900 text-base font-medium
border border-gray-200 rounded-xl
hover:bg-gray-50 active:scale-[0.98]
focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600
transition-all duration-200


Input / Select / Textarea

h-14 w-full px-4 py-3 text-base
bg-white border border-gray-300 rounded-xl
placeholder:text-gray-400
focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0
aria-[invalid=true]:border-red-600


Card (pick one per page)

/* Border */
bg-white border border-gray-200 rounded-xl p-6

/* OR Shadow */
bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6


Bottom Tab Item

flex flex-col items-center justify-center
min-w-[72px] h-16
text-sm
aria-[current=true]:text-blue-600


Always show icon + label. No icon-only tabs.

Content & layout guardrails

Headings: text-2xl to text-4xl, 1.5 line height.

Body: text-base → md:text-lg.

Readable width: wrap long text in max-w-[65ch].

White space: use only 8-point steps; between tappables use gap-4 or gap-6.

Copy: verb-first CTAs, 6–8 words max. No jargon.

Recording screen (tight spec)

Timer text-5xl font-semibold, near-black on white.

One primary button: Record (blue-600).

Tap to pause/resume. No long-press.

Subtle single pulse: animate-pulse opacity-30 under the mic icon only.

Helper text: “Take your time. You can edit later.”

Timeline

Grid/list cards with consistent gap-6.

Year markers prominent, text-xl font-semibold.

Wisdom/Lessons use amber-50 background with black text and left border amber-400.

Card actions as 60 px buttons with labels: Play, Share, Print.

Story Ideas / Prompts

Each prompt has a Record button.

Categories as labeled chips, 32+ px tall.

If you keep a purple-blue gradient, limit to the hero and ensure text 4.5:1.

Progressive disclosure: collapsed by default, expand for details.

Accessibility specifics to add

Respect Bold Text, Reduce Motion, Increase Contrast.

VoiceOver/TalkBack: every control has role, name, state.

Text scaling: test iOS AX3–AX5 and Android at 200%; no clipped controls; scroll instead.

Focus styles: always visible (focus:ring-2 focus:ring-blue-600 focus:ring-offset-2).

Never rely on color alone; pair with icons and text.

Proxy & Simple Mode (add these to the system)

Proxy/Caregiver: invite by link → role selection (view, assist) → audit trail.

Simple Mode: larger type preset, fewer tabs, fewer actions per screen. Toggle in Settings, remember per user.

QA checklist (ship gate)

Body text ≥18 px; captions only may be 16 px.

All tappables ≥48 px; primaries ≥60 px; 16–24 px between tappables.

Blue buttons are blue-600+; success/error use the darker tokens above.

Contrast AA passes in light and dark.

Icon + label on tabs; ≤4 items.

Inputs are 56 px tall with inline validation.

Skeletons replace spinners for content lists.

Full flows usable at 200%/AX5 with screen readers on.

Why these edits matter

Blue-600 fixes contrast so your white CTA text is readable at any size.

Darker success/error colors prevent failure states that look “fine” to us but unreadable to seniors.

18 px base body + 56/60 px controls materially reduce mis-taps and rereads.

Max line length and visible labels speed comprehension and cut errors.
