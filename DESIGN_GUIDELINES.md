HeritageWhisper Design Guidelines

North star:
Calm, book like, trustworthy.
Middle aged adults and seniors should be able to browse for hours with zero strain.

Warm paper backgrounds, not clinical white

Deep slate blue as the spine color

Muted green as support

Gold accent used sparingly

One clean sans serif for almost everything

Big, readable type and large hit targets

1. Brand palette
1.1 Color tokens

Use these as the single source of truth in code and design.

:root {
  /* Brand core */
  --hw-page-bg: #F7F2EC;   /* warm paper background */
  --hw-section-bg: #EFE6DA;
  --hw-surface: #FFFFFF;

  --hw-primary: #203954;         /* deep slate blue */
  --hw-primary-hover: #1B3047;
  --hw-primary-soft: #E0E5ED;    /* very light tint for badges etc */

  --hw-secondary: #3E6A5A;       /* muted green */
  --hw-secondary-hover: #355C4E;
  --hw-secondary-soft: #DDE7E1;

  --hw-accent-gold: #CBA46A;     /* premium accent, use sparingly */
  --hw-accent-gold-soft: #F4E6CC;

  /* Text */
  --hw-text-primary: #1F1F1F;    /* near black */
  --hw-text-secondary: #4A4A4A;  /* long captions, helper text */
  --hw-text-muted: #8A8378;      /* meta, not for main copy */
  --hw-text-on-dark: #FFFFFF;

  /* Borders and dividers */
  --hw-border-subtle: #D2C9BD;
  --hw-border-strong: #B8AA9C;

  /* Status */
  --hw-success: #166534;         /* works with white text */
  --hw-error: #B91C1C;
  --hw-warning-bg: #FFFBEB;
  --hw-warning-accent: #B45309;
  --hw-info: #1D4ED8;

  /* Typography base */
  --hw-font-body-size: 18px;
  --hw-font-line-height: 1.6;

  /* Hit targets and spacing */
  --hw-hit-min: 48px;
  --hw-hit-primary: 60px;
  --hw-gap-sm: 8px;
  --hw-gap-md: 16px;
  --hw-gap-lg: 24px;
}
html {
  font-size: var(--hw-font-body-size);
}

1.2 Palette usage

Backgrounds

Page background: --hw-page-bg

Alternate bands: --hw-section-bg

Cards and modal surfaces: --hw-surface

Primary color (blue)

Main CTAs and primary links

Logo and key navigation

Important icons

Secondary color (green)

Secondary buttons

Filters, chips, tags, timeline markers

Non destructive confirmation states

Accent gold

Small icons, separators, chapter markers

Underline for current nav item

Highlight for “Wisdom” or “Gold insight” labels

Never use as a full button background with body text

Status

Do not theme status onto brand colors. Use --hw-success, --hw-error, --hw-info and keep them separate from primary/secondary.

Do not

Introduce extra brand colors without a very specific job

Put long body text directly on saturated colors

Use low contrast gray text on colored backgrounds

2. Typography
2.1 Font family

Use a single, clean, humanist sans.

Recommended primary font

font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont,
  "Segoe UI", sans-serif;


Alternative options if needed:

Source Sans 3

Lato

Use this family for:

Body copy

Navigation

Buttons

Labels

Most headings

If you later add a serif, reserve it for large hero headings only.

2.2 Type scale

Base body size is set by --hw-font-body-size.

Recommended scale:

H1: 32 to 36 px, line height 1.3

H2: 24 to 28 px, line height 1.35

H3: 20 to 22 px, line height 1.4

Body: 18 px, line height 1.6 (default)

Small helper text and captions: 16 px, line height 1.5 minimum

Line length for paragraphs:

Max width: 60 to 75 characters
In Tailwind: max-w-[65ch]

2.3 Weights

Body text: Regular (400)

Navigation, buttons, labels: Medium (500)

Section headings: Semibold (600)

Do not use Light or Thin weights for anything that must be read clearly.

2.4 Case and styling

Sentence case for almost everything

All caps restricted to short labels and HERITAGE in the logo

No long strings of all caps in body text

3. Layout and spacing
3.1 Spacing system

Use multiples of 8 for vertical rhythm:

8 px small

16 px default gap between controls

24 px or 32 px between grouped sections

Between tappable elements:

Minimum gap: 16 px

Preferred gap: 24 px

3.2 Hit targets

All tappable targets at least 48 px tall and wide

Primary actions and major CTAs at least 60 px tall

This applies to: buttons, list items, tabs, pills, icons with actions.

3.3 Grids and content width

Desktop:

Core content width: 960 to 1140 px

Long reading sections wrapped in max-w-[65ch] containers

Generous left and right margins so the experience feels like a book, not a dashboard

Mobile:

Maintain side padding of 16 to 24 px

Avoid edge to edge text except for short labels

4. Navigation
4.1 Global nav

Background: tinted bar, not fully transparent glass

On normal content: rgba(247, 242, 236, 0.9) over the page

On photo hero: rgba(32, 57, 84, 0.9) with white text

Nav text:

Font: Inter medium

Size: 16 px minimum on desktop, 14 to 16 px on mobile

Color on light nav: --hw-primary

Color on dark nav: --hw-text-on-dark

Active item:

Text color: --hw-primary

Bottom underline or pill indicator in --hw-accent-gold

Limit top level nav items to 4 to 6.

4.2 Bottom tabs (app style)

Icon plus label, label always visible

Max 4 tabs

Label size at least 14 px

Tailwind example:

<button
  class="
    flex flex-col items-center justify-center
    min-w-[72px] h-16 text-sm
    text-hw-text-secondary
    aria-[current=true]:text-hw-primary
  "
>
  ...
</button>

5. Components
5.1 Primary button

Usage:

Main call to action on a page or card

Save, Continue, Start recording, Invite family

Visual:

Background: --hw-primary

Text: white

Height: 60 px

Tailwind example:

<button
  class="
    w-full min-h-[60px] px-8 py-4
    bg-[var(--hw-primary)] text-white text-lg font-medium
    rounded-xl shadow-sm
    hover:bg-[var(--hw-primary-hover)] hover:shadow-md
    active:scale-[0.98]
    focus:outline-none focus:ring-2
    focus:ring-offset-2 focus:ring-[var(--hw-primary)]
    focus:ring-offset-[var(--hw-page-bg)]
    transition-all duration-200
  "
>
  Save this story
</button>

5.2 Secondary button

Usage:

Secondary actions such as Preview, Cancel, Learn more

Visual:

Outline or soft fill

Text in --hw-text-primary

Example:

<button
  class="
    w-full min-h-[48px] px-6 py-3
    bg-[var(--hw-surface)] text-[var(--hw-text-primary)]
    text-base font-medium
    border border-[var(--hw-border-subtle)] rounded-xl
    hover:bg-[var(--hw-section-bg)]
    active:scale-[0.98]
    focus:outline-none focus:ring-2
    focus:ring-offset-2 focus:ring-[var(--hw-primary)]
    focus:ring-offset-[var(--hw-page-bg)]
    transition-all duration-200
  "
>
  Preview sample book
</button>

5.3 Ghost / tertiary button

Link like actions (View details, Edit title) can be simple text buttons:

Text color: --hw-primary

Underline on hover

No filled background

5.4 Inputs

Height: 56 px

Full width by default

Label always visible above the field

Example:

<label class="block space-y-1">
  <span class="text-sm font-medium text-[var(--hw-text-primary)]">
    Story title
  </span>
  <input
    class="
      h-14 w-full px-4 py-3 text-base
      bg-[var(--hw-surface)]
      border border-[var(--hw-border-subtle)] rounded-xl
      text-[var(--hw-text-primary)]
      placeholder:text-[var(--hw-text-muted)]
      focus:border-[var(--hw-primary)]
      focus:ring-2 focus:ring-[var(--hw-primary)] focus:ring-offset-0
      aria-[invalid=true]:border-[var(--hw-error)]
    "
    placeholder="Grandpa’s first job"
  />
</label>


Validation and helper text in 16 px, --hw-text-secondary.

5.5 Cards

Use one of these patterns per page, not both.

Bordered card:

<div
  class="
    bg-[var(--hw-surface)]
    border border-[var(--hw-border-subtle)]
    rounded-xl p-6
  "
>
  ...
</div>


Soft shadow card:

<div
  class="
    bg-[var(--hw-surface)]
    rounded-xl shadow-sm hover:shadow-md
    transition-shadow p-6
  "
>
  ...
</div>


Timeline and memory cards should use --hw-section-bg behind groups to create “chapters”.

5.6 Chips and tags

Height at least 32 px

Rounded full or large radius

Background:

Default: --hw-primary-soft or --hw-secondary-soft

Text: --hw-primary or --hw-secondary

6. Content and copy
6.1 Voice

Calm, clear, reassuring

Direct language, no jargon

CTAs:

Verb first, 6 to 8 words max

Examples:

Save this story

Invite your family to listen

Print a keepsake book

6.2 Layout of content

For long form text:

H2 heading

Short intro paragraph

Break into sections with subheadings and lists

Avoid walls of text longer than about 5 to 6 lines at desktop width

Use the warmer backgrounds to break the page into “chapters”:

Hero section: --hw-page-bg

Benefits band: --hw-section-bg

Testimonial band: slightly darker --hw-section-bg plus gold accents

7. Accessibility and older adults

High impact rules:

Body text at least 18 px

Captions no smaller than 16 px

Never use text lighter than #777777 on anything except disabled controls

All interactive elements 48 px minimum size, primary 60 px

Contrast ratios:

Normal text at least 4.5:1

Large text 3:1 or more

Aim above this rather than just meeting the minimum

Behavior:

Respect system settings for Bold Text, Reduce Motion, Increase Contrast

Support at least 200 percent text scaling without clipping; allow scroll rather than truncation

Focus outlines:

Always visible, ring around the element in --hw-primary with offset

Semantics:

Every control has role, name, and state for screen readers

Do not rely on color alone for meaning; pair with icons and labels

8. Simple Mode and caregiver patterns
8.1 Simple Mode

A view preset aimed at seniors who want very low cognitive load.

Characteristics:

Larger base font (20 px)

Fewer visible choices per screen

Reduced color variation (mostly background + primary blue)

Bigger buttons, one primary action per panel

Implementation:

Toggle in Settings that remembers per user

Optional quick toggle if a caregiver is assisting

8.2 Proxy and caregiver access

Pattern:

Invite link sent by email or message

Role selection:

View only

Assist (can set up prompts, organize, but not delete stories)

Activity log viewable by the account owner

9. Recording and timeline specifics
9.1 Recording screen

Large timer at top, 32 px or larger, near black on white

One big primary button in blue with clear label:

Start recording / Pause recording / Resume recording

Subtle pulse animation only under the mic icon

Helper text in 16 px:

Take your time. You can edit later.

No long press actions.

9.2 Timeline and memories

Cards grouped by decade or year, each group on --hw-section-bg

Year labels in 20 to 24 px, medium weight

Wisdom or Lessons callouts:

Background --hw-accent-gold-soft

Left border --hw-accent-gold

Text in --hw-text-primary

Action buttons on cards:

Play, Share, Print

Each as a 60 px tall button or clearly tappable control with icon plus label

Skeleton loaders instead of spinners while content loads.

10. QA checklist before shipping

Use this as a gate for any new feature or page.

 Body text is 18 px or larger

 Captions are 16 px or larger

 All interactive elements are at least 48 px, primary actions 60 px

 Spacing between tappable elements is at least 16 px

 No gray text under #777 on colored backgrounds

 All CTAs use --hw-primary for fill and white text

 Success and error messages use the status tokens, not random reds or greens

 Long paragraphs are constrained with max-w-[65ch]

 Logo uses updated deep blue and sits cleanly on --hw-page-bg and dark overlays

 Nav is readable at a glance over photos and backgrounds

 Text scaling at 200 percent still works without clipping; scroll works everywhere

 Screen reader users can navigate every flow
