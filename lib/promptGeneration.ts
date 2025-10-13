/* promptGeneration.ts
   HeritageWhisper — Tier-1 prompt generation with quality gates
   Drop-in replacement. Exports:
     - generateTier1Prompts(...)
     - validatePromptQuality(...)
     - isWorthyEntity(...)
*/

export type CandidateEntity = {
  kind: "person" | "place" | "object" | "emotion";
  text: string;            // raw surface form from story
  canonical?: string;      // optional normalized label
  meta?: Record<string, any>;
};

export type StoryInput = {
  userId: string;
  storyId: string;
  text: string;                 // full cleaned transcript
  entities: CandidateEntity[];  // NER or your extractor output
  // optional extras you already compute
  yearHint?: number | null;
  emotions?: string[];          // detected primary emotions
};

export type PromptOut = {
  prompt_text: string;
  type: "person_expansion" | "place_memory" | "object_as_bridge" | "emotion_link" | "decade_fallback";
  confidence: number;          // 0 to 1
  source_story_id: string;
  anchor?: string;             // entity or phrase used
  word_count: number;
  priority: number;            // for your queue ordering
};

/* === Quality guards === */

const GENERIC_WORDS = new Set([
  "girl","boy","man","woman","house","room","chair","place","thing","person","kid","child"
]);

const BANNED_PHRASES = [
  "tell me more",
  "what else",
  "how did that make you feel",
  "in your story about", // robotic
];

export function isWorthyEntity(s?: string): boolean {
  if (!s) return false;
  const t = s.trim();
  if (!t) return false;
  if (GENERIC_WORDS.has(t.toLowerCase())) return false;
  // signals of specificity: possessive, proper-like casing, or "my X"
  if (/(?:^|\s)(?:my\s+[a-z][a-z]+|'s\b)/i.test(t)) return true;
  if (/^[A-Z][a-z]+(?:\s[A-Z][a-z]+)*$/.test(t)) return true; // looks like a proper name
  // allow compound nouns that are specific enough
  if (/\b(?:workbench|blue bench|brownstone|chevelle|ridge trail|st joseph hospital)\b/i.test(t)) return true;
  return t.split(/\s+/).length >= 2; // at least two tokens tends to be more specific
}

export function validatePromptQuality(p?: string): boolean {
  if (!p) return false;
  const wc = p.trim().split(/\s+/).length;
  if (wc === 0 || wc > 30) return false;

  const lower = p.toLowerCase();
  if (/\b(girl|boy|man|woman|house|room|chair)\b/.test(lower)) return false;

  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase)) return false;
  }

  // avoid yes/no framing
  if (/^(did|was|were|is|are|do|does|have|has)\b/i.test(p.trim())) return false;

  return true;
}

/* === Template library (relationship-first, 30 words max) === */

type TemplateSpec = {
  trigger: "person_mentioned" | "place_mentioned" | "object_mentioned" | "emotion_detected";
  patterns: string[];
  priority: number; // 0 to 100
  type: PromptOut["type"];
};

const TEMPLATE_LIBRARY: TemplateSpec[] = [
  {
    trigger: "person_mentioned",
    type: "person_expansion",
    priority: 95,
    patterns: [
      "{person} mattered. What did they teach you that truly stuck?",
      "When did you first see {person} differently than before?",
      "What is a line {person} said that you still hear today?",
      "Who else was with you the day {person} changed your mind?"
    ]
  },
  {
    trigger: "place_mentioned",
    type: "place_memory",
    priority: 88,
    patterns: [
      "{place} keeps showing up. Who shared that place with you, and why?",
      "When did {place} stop feeling the same to you?",
      "What happened at {place} that you rarely talk about?"
    ]
  },
  {
    trigger: "object_mentioned",
    type: "object_as_bridge",
    priority: 85,
    patterns: [
      "{object} did not appear from nowhere. Who handed it to you, and why?",
      "When did {object} stop being a thing and start meaning something deeper?"
    ]
  },
  {
    trigger: "emotion_detected",
    type: "emotion_link",
    priority: 80,
    patterns: [
      "You felt {emotion}. When did that feeling first teach you something important?",
      "Who helped you carry that {emotion} back then?"
    ]
  }
];

/* === Builders === */

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clampConfidence(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function wc(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function buildFromPattern(pattern: string, slots: Record<string, string>): string {
  let out = pattern;
  for (const [k, v] of Object.entries(slots)) {
    out = out.replaceAll(`{${k}}`, v);
  }
  return out;
}

/* === Public API: generateTier1Prompts === */

export function generateTier1Prompts(input: StoryInput): PromptOut[] {
  const out: PromptOut[] = [];
  const { storyId, entities, emotions = [] } = input;

  // Partition entities by kind and filter for worthiness
  const persons  = entities.filter(e => e.kind === "person" && isWorthyEntity(e.text));
  const places   = entities.filter(e => e.kind === "place"  && isWorthyEntity(e.text));
  const objects  = entities.filter(e => e.kind === "object" && isWorthyEntity(e.text));
  const emos     = (emotions || []).map(e => e.trim()).filter(Boolean);

  // Person prompts
  if (persons.length) {
    const t = TEMPLATE_LIBRARY.find(t => t.trigger === "person_mentioned")!;
    const who = pick(persons).text.trim();
    const raw = buildFromPattern(pick(t.patterns), { person: who });
    if (validatePromptQuality(raw)) {
      out.push({
        prompt_text: raw,
        type: t.type,
        confidence: clampConfidence(0.88),
        source_story_id: storyId,
        anchor: who,
        word_count: wc(raw),
        priority: t.priority
      });
    }
  }

  // Place prompts
  if (places.length) {
    const t = TEMPLATE_LIBRARY.find(t => t.trigger === "place_mentioned")!;
    const pl = pick(places).text.trim();
    const raw = buildFromPattern(pick(t.patterns), { place: pl });
    if (validatePromptQuality(raw)) {
      out.push({
        prompt_text: raw,
        type: t.type,
        confidence: clampConfidence(0.82),
        source_story_id: storyId,
        anchor: pl,
        word_count: wc(raw),
        priority: t.priority
      });
    }
  }

  // Object prompts
  if (objects.length) {
    const t = TEMPLATE_LIBRARY.find(t => t.trigger === "object_mentioned")!;
    const obj = pick(objects).text.trim();
    const raw = buildFromPattern(pick(t.patterns), { object: obj });
    if (validatePromptQuality(raw)) {
      out.push({
        prompt_text: raw,
        type: t.type,
        confidence: clampConfidence(0.80),
        source_story_id: storyId,
        anchor: obj,
        word_count: wc(raw),
        priority: t.priority
      });
    }
  }

  // Emotion prompts
  if (emos.length) {
    const t = TEMPLATE_LIBRARY.find(t => t.trigger === "emotion_detected")!;
    const em = pick(emos);
    const raw = buildFromPattern(pick(t.patterns), { emotion: em });
    if (validatePromptQuality(raw)) {
      out.push({
        prompt_text: raw,
        type: t.type,
        confidence: clampConfidence(0.78),
        source_story_id: storyId,
        anchor: em,
        word_count: wc(raw),
        priority: t.priority
      });
    }
  }

  // If none passed, provide a calm decade fallback. This will be used by the API as last resort.
  if (out.length === 0) {
    const fallback = decadeFallback(input.yearHint);
    out.push(fallback);
  }

  // Sort by priority, then confidence
  out.sort((a, b) => b.priority - a.priority || b.confidence - a.confidence);
  return out;
}

/* === Decade fallback, safe and under 30 words === */

function decadeFallback(yearHint?: number | null): PromptOut {
  const decadeLabel = typeof yearHint === "number" && isFinite(yearHint)
    ? `${Math.floor(yearHint / 10) * 10}s`
    : "your early years";

  const text = `Think back to ${decadeLabel}. What is a decision you made then that still echoes in your life today?`;

  return {
    prompt_text: text,
    type: "decade_fallback",
    confidence: 0.6,
    source_story_id: "fallback",
    anchor: decadeLabel,
    word_count: wc(text),
    priority: 50
  };
}
