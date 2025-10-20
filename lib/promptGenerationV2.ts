/**
 * Tier 1 Prompt Generation V2 - Relationship-First Approach
 * 
 * Replaces entity-based sensory prompts with intimacy-focused questions
 * that prove deep listening and demonstrate emotional intelligence.
 * 
 * Key principles:
 * - Focus on relationships, meaning, and emotional truth
 * - Use specific details from stories (names, phrases, not generics)
 * - All prompts under 30 words
 * - Conversational tone, not therapy-speak
 * - Quality gates prevent generic/robotic prompts
 */

import { createHash } from "crypto";
import { sanitizeForGPT, normalizeEntity } from "./sanitization";
import {
  isWorthyEntity,
  validatePromptQuality,
  scorePromptQuality,
} from "./promptQuality";

// ============================================================================
// TYPES
// ============================================================================

export interface ExtractedEntities {
  people: string[];
  places: string[];
  objects: string[];
  emotions: string[];
  uniquePhrases: Array<{ text: string; context: string }>;
}

export interface Tier1Prompt {
  text: string;
  context: string;
  entity: string;
  type: string;
  anchorHash: string;
  tier: number;
  memoryType: string;
  promptScore: number;
  wordCount: number;
}

// ============================================================================
// ENTITY EXTRACTION (with quality filtering)
// ============================================================================

/**
 * Extract meaningful entities from transcript
 * Uses quality gates to filter out generic nouns
 */
export function extractEntities(transcript: string): ExtractedEntities {
  const sanitized = sanitizeForGPT(transcript);
  
  console.log("[Entity Extraction V2] Processing transcript...");
  
  // Extract people (with quality filtering)
  const people = new Set<string>();
  
  // Pattern 1: Proper names (capitalized, followed by action verb)
  const namePattern = /\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)?)\s+(?:said|told|taught|showed|gave|asked|wanted|helped|loved|knew|met|called)/g;
  const excludeSinglePronouns = new Set(["She", "He", "They", "We", "It"]);
  const nameMatches = Array.from(sanitized.matchAll(namePattern));
  for (const match of nameMatches) {
    const name = match[1];
    if (!excludeSinglePronouns.has(name) && isWorthyEntity(name)) {
      people.add(name);
    }
  }
  
  // Pattern 2: Possessive relationships (my father, his mother, etc.)
  const possessivePattern = /\b(my|his|her|their|our)\s+(father|mother|dad|mom|brother|sister|son|daughter|grandfather|grandmother|grandpa|grandma|spouse|husband|wife|partner)\b/gi;
  const possessiveMatches = Array.from(sanitized.matchAll(possessivePattern));
  for (const match of possessiveMatches) {
    const person = match[0];
    if (isWorthyEntity(person)) {
      people.add(person);
    }
  }
  
  // Pattern 3: Named titles (Coach, Teacher, etc. - standalone)
  const titlePattern = /\b(Coach|Teacher|Doctor|Professor|Captain|Pastor|Father|Mother|Boss)(\s+[A-Z][a-z]+)?\b/g;
  const titleMatches = Array.from(sanitized.matchAll(titlePattern));
  for (const match of titleMatches) {
    const title = match[0];
    if (isWorthyEntity(title)) {
      people.add(title);
    }
  }
  
  // Extract places (with quality filtering)
  const places = new Set<string>();
  
  // Pattern 1: Possessive places (father's workshop, Coach's office)
  // Match: [Name]'s [place-type] OR [possessive] [person] [place-type]
  const possessivePlacePattern = /\b([A-Z][a-z]+(?:'s|(?:\s+[A-Z][a-z]+)?'s)?|(?:my|his|her|their|our)\s+(?:[A-Z][a-z]+(?:'s)?|father|mother|dad|mom))\s+(workshop|office|cabin|shop|studio|garage|barn|house|home)\b/gi;
  const possessivePlaceMatches = Array.from(sanitized.matchAll(possessivePlacePattern));
  for (const match of possessivePlaceMatches) {
    const place = match[0].trim();
    if (isWorthyEntity(place) && !people.has(place)) {
      places.add(place);
    }
  }
  
  // Pattern 2: Named locations (Springfield, Oak Ridge Trail, St. Joseph Hospital)
  const namedLocationPattern = /\b(?:at|in|to|from|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/g;
  const namedLocationMatches = Array.from(sanitized.matchAll(namedLocationPattern));
  for (const match of namedLocationMatches) {
    const location = match[1].trim();
    // Only add if it looks like a place name (2+ words, capitalized)
    if (location.split(/\s+/).length >= 2 && isWorthyEntity(location) && !people.has(location)) {
      places.add(location);
    }
  }
  
  // Extract objects (with quality filtering)
  const objects = new Set<string>();

  // Body parts and clothing blocklist - these should NEVER be extracted as objects
  const bodyPartsBlocklist = new Set([
    "chest", "knees", "legs", "arms", "hands", "feet", "head", "eyes", "ears",
    "nose", "mouth", "back", "shoulders", "fingers", "toes", "neck", "face",
    "heart", "stomach", "belly", "hips", "ankle", "wrist", "elbow", "knee",
    // Common clothing (unless branded/specific)
    "shirt", "pants", "shoes", "socks", "dress", "coat", "jacket", "hat"
  ]);

  // Pattern 1: Possessive + specific vehicle/object (my Chevelle, his Harley, her ring)
  // Only match capitalized objects or specific compound nouns (workbench, toolbox)
  const possessiveObjectPattern = /\b(my|his|her|their|our)\s+(?:([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)|(?:old|blue|red|green)\s+([A-Z][a-z]+)|(workbench|toolbox|truck|car|bike|ring|watch|camera))\b/gi;
  const objectMatches = Array.from(sanitized.matchAll(possessiveObjectPattern));
  for (const match of objectMatches) {
    const obj = match[0].trim();
    // Filter out if it's actually a person reference
    const secondWord = obj.split(/\s+/)[1]?.toLowerCase();
    const familyRoles = ["father", "mother", "dad", "mom", "brother", "sister", "son", "daughter"];

    // NEW: Filter out body parts and generic clothing
    if (bodyPartsBlocklist.has(secondWord)) {
      console.log(`[Entity Extraction] REJECTED body part/clothing: "${obj}"`);
      continue;
    }

    if (!familyRoles.includes(secondWord) && isWorthyEntity(obj) && !people.has(obj)) {
      objects.add(obj);
    }
  }
  
  // Extract emotions (keep existing logic)
  const emotionWords = [
    "scared",
    "afraid",
    "proud",
    "ashamed",
    "excited",
    "nervous",
    "anxious",
    "relieved",
    "disappointed",
    "grateful",
    "angry",
    "sad",
    "happy",
    "lonely",
    "loved",
    "betrayed",
    "confused",
    "determined",
    "hopeful",
    "heartbroken",
    "overwhelmed",
  ];
  
  const normalized = sanitized.toLowerCase();
  const emotions: string[] = [];
  
  emotionWords.forEach((emotion) => {
    if (normalized.includes(emotion)) {
      emotions.push(emotion);
    }
  });
  
  // Extract unique phrases (exact quotes, key phrases)
  const uniquePhrases: Array<{ text: string; context: string }> = [];
  
  // Pattern 1: Quoted text
  const quotedPattern = /[""']([^""']{10,50})[""']/g;
  const quotedMatches = Array.from(sanitized.matchAll(quotedPattern));
  for (const match of quotedMatches) {
    const quote = match[1].trim();
    if (quote.length >= 10 && quote.length <= 50) {
      uniquePhrases.push({
        text: quote,
        context: sanitized.substring(Math.max(0, match.index! - 30), match.index! + quote.length + 30)
      });
    }
  }
  
  // Pattern 2: Memorable phrases with emotional markers
  const memorablePattern = /\b(never forget|always remember|still [a-z]+|can't forget|will never)\s+([^.!?]{10,40})[.!?]/gi;
  const memorableMatches = Array.from(sanitized.matchAll(memorablePattern));
  for (const match of memorableMatches) {
    const phrase = match[2].trim();
    uniquePhrases.push({
      text: phrase,
      context: match[0]
    });
  }
  
  const extracted = {
    people: Array.from(people),
    places: Array.from(places),
    objects: Array.from(objects),
    emotions,
    uniquePhrases,
  };
  
  console.log("[Entity Extraction V2] Results:", {
    people: extracted.people.length,
    places: extracted.places.length,
    objects: extracted.objects.length,
    emotions: extracted.emotions.length,
    uniquePhrases: extracted.uniquePhrases.length,
  });
  
  return extracted;
}

// ============================================================================
// RELATIONSHIP-FIRST TEMPLATES
// ============================================================================

interface TemplateSpec {
  trigger: "person" | "place" | "object" | "emotion";
  patterns: string[];
  priority: number;
  memoryType: string;
}

/**
 * New templates focus on relationships, meaning, and emotional truth
 * All under 30 words, conversational tone, no sensory details without context
 */
const RELATIONSHIP_TEMPLATES: TemplateSpec[] = [
  {
    trigger: "person",
    memoryType: "person_expansion",
    priority: 95,
    patterns: [
      "{person} mattered to you. What did they teach you that truly stuck?",
      "When did you first see {person} differently than before?",
      "What is a line {person} said that you still hear today?",
      "Who else was with you the day {person} changed your mind?",
      "What did {person} believe about you that turned out to be true?",
      "When did you realize {person} was right about you?",
      "What part of {person} do you see in yourself now?",
      "Who did {person} remind you of back then?",
      "What would {person} say if they could see you today?",
      "When did you stop trying to impress {person}?",
    ],
  },
  {
    trigger: "place",
    memoryType: "place_memory",
    priority: 88,
    patterns: [
      "{place} keeps showing up in your stories. Who shared that place with you?",
      "When did {place} stop feeling the same to you?",
      "What happened at {place} that you rarely talk about?",
      "Who taught you about {place} without meaning to?",
      "What did you leave behind at {place}?",
      "When did you realize you'd never return to {place}?",
    ],
  },
  {
    trigger: "object",
    memoryType: "object_as_bridge",
    priority: 85,
    patterns: [
      "{object} didn't appear from nowhere. Who handed it to you, and why?",
      "When did {object} start meaning more than you expected?",
      "What did {object} cost you that wasn't about money?",
      "Who else touched {object} before it came to you?",
    ],
  },
  {
    trigger: "emotion",
    memoryType: "emotion_link",
    priority: 80,
    patterns: [
      "You felt {emotion}. When did that feeling first teach you who you are?",
      "Who helped you carry that {emotion} back then?",
      "What did feeling {emotion} make you decide about yourself?",
      "When was the last time you felt that {emotion} and didn't tell anyone?",
    ],
  },
];

// ============================================================================
// PROMPT GENERATION
// ============================================================================

/**
 * Generate Tier 1 prompts using relationship-first templates
 * Filters through quality gates before returning
 */
export function generateTier1Templates(
  transcript: string,
  year: number | null = null,
): Tier1Prompt[] {
  const entities = extractEntities(transcript);
  const prompts: Tier1Prompt[] = [];
  
  // Helper to build prompt from template
  const buildPrompt = (
    template: TemplateSpec,
    entity: string,
    pattern: string,
  ): Tier1Prompt | null => {
    // Replace placeholder with entity
    const placeholder = `{${template.trigger}}`;
    const text = pattern.replace(placeholder, entity);
    
    // Validate quality
    if (!validatePromptQuality(text)) {
      console.log(`[Tier 1] REJECTED prompt: "${text}"`);
      return null;
    }
    
    const wordCount = text.split(/\s+/).length;
    const anchorHash = generateAnchorHash(template.memoryType, entity, year);
    const promptScore = scorePromptQuality(text, {
      usesExactPhrase: false,
      referencesMultipleStories: false,
    });
    
    return {
      text,
      context: `Based on what you shared`,
      entity,
      type: template.memoryType,
      anchorHash,
      tier: 1,
      memoryType: template.memoryType,
      promptScore,
      wordCount,
    };
  };
  
  // Generate person prompts (max 2)
  if (entities.people.length > 0) {
    const personTemplate = RELATIONSHIP_TEMPLATES.find(t => t.trigger === "person")!;
    const selectedPeople = entities.people.slice(0, 2); // Take top 2
    
    for (const person of selectedPeople) {
      const pattern = personTemplate.patterns[Math.floor(Math.random() * personTemplate.patterns.length)];
      const prompt = buildPrompt(personTemplate, person, pattern);
      if (prompt) {
        prompts.push(prompt);
      }
    }
  }
  
  // Generate place prompt (max 1)
  if (entities.places.length > 0 && prompts.length < 3) {
    const placeTemplate = RELATIONSHIP_TEMPLATES.find(t => t.trigger === "place")!;
    const place = entities.places[0];
    const pattern = placeTemplate.patterns[Math.floor(Math.random() * placeTemplate.patterns.length)];
    const prompt = buildPrompt(placeTemplate, place, pattern);
    if (prompt) {
      prompts.push(prompt);
    }
  }
  
  // Generate object prompt (max 1, if room)
  if (entities.objects.length > 0 && prompts.length < 3) {
    const objectTemplate = RELATIONSHIP_TEMPLATES.find(t => t.trigger === "object")!;
    const obj = entities.objects[0];
    const pattern = objectTemplate.patterns[Math.floor(Math.random() * objectTemplate.patterns.length)];
    const prompt = buildPrompt(objectTemplate, obj, pattern);
    if (prompt) {
      prompts.push(prompt);
    }
  }
  
  // Generate emotion prompt (fallback, if room)
  if (entities.emotions.length > 0 && prompts.length < 3) {
    const emotionTemplate = RELATIONSHIP_TEMPLATES.find(t => t.trigger === "emotion")!;
    const emotion = entities.emotions[0];
    const pattern = emotionTemplate.patterns[Math.floor(Math.random() * emotionTemplate.patterns.length)];
    const prompt = buildPrompt(emotionTemplate, emotion, pattern);
    if (prompt) {
      prompts.push(prompt);
    }
  }
  
  console.log(`[Tier 1] Generated ${prompts.length} prompts (all passed quality gates)`);
  
  return prompts;
}

// ============================================================================
// ANCHOR HASH GENERATION
// ============================================================================

export function generateAnchorHash(
  type: string,
  entity: string,
  year: number | null,
): string {
  const normalized = normalizeEntity(entity);
  const yearStr = year ? year.toString() : "NA";
  const input = `${type}|${normalized}|${yearStr}`;
  
  return createHash("sha1").update(input).digest("hex");
}
