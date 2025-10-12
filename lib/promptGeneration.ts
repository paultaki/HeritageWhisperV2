/**
 * Tier 1 Template-Based Prompt Generation
 *
 * Extracts entities from story transcripts and generates prompts using
 * pre-defined templates. Fast, synchronous, no API calls required.
 */

import { createHash } from "crypto";

// ============================================================================
// TYPES
// ============================================================================

export interface ExtractedEntities {
  people: string[];
  places: string[];
  objects: string[];
  emotions: string[];
  temporalBoundaries: string[];
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
}

interface PromptTemplate {
  trigger: string;
  patterns: string[];
  context: string;
  priority: number;
}

// ============================================================================
// ENTITY EXTRACTION
// ============================================================================

/**
 * Extract entities from transcript using regex patterns
 */
export function extractEntities(transcript: string): ExtractedEntities {
  const normalized = transcript.toLowerCase();

  console.log(
    "[Entity Extraction] Processing transcript:",
    transcript.substring(0, 100) + "...",
  );

  // Extract people - combination of proper nouns and role nouns
  const people = new Set<string>();
  const excludeWords = new Set([
    "The",
    "I",
    "We",
    "They",
    "And",
    "But",
    "So",
    "Then",
    "When",
    "Where",
    "What",
    "How",
    "Why",
    "This",
    "That",
    "These",
    "Those",
    "There",
    "Here",
    "Now",
    "Just",
    "Only",
    "Even",
    "Still",
    "Yet",
    "Already",
    "Before",
    "After",
  ]);

  // Pattern 1: Role nouns WITH articles (the girl, my friend, Coach, etc.)
  const roleNouns = [
    "coach",
    "teacher",
    "instructor",
    "mentor",
    "boss",
    "manager",
    "friend",
    "boyfriend",
    "girlfriend",
    "partner",
    "spouse",
    "father",
    "mother",
    "dad",
    "mom",
    "parent",
    "son",
    "daughter",
    "child",
    "kid",
    "brother",
    "sister",
    "sibling",
    "cousin",
    "uncle",
    "aunt",
    "nephew",
    "niece",
    "grandfather",
    "grandmother",
    "grandpa",
    "grandma",
    "grandchild",
    "grandson",
    "granddaughter",
    "husband",
    "wife",
    "neighbor",
    "neighbour",
    "colleague",
    "coworker",
    "doctor",
    "nurse",
    "lawyer",
    "officer",
    "captain",
    "sergeant",
    "man",
    "woman",
    "boy",
    "girl",
    "guy",
    "lady",
    "gentleman",
    "priest",
    "pastor",
    "minister",
    "rabbi",
  ];

  // Match role nouns with articles - KEEP THE FULL PHRASE
  const rolePattern = new RegExp(
    `\\b((?:my|his|her|their|our|the|a|an)\\s+${roleNouns.join("|")})\\b`,
    "gi",
  );

  const roleMatches = Array.from(transcript.matchAll(rolePattern));
  for (const match of roleMatches) {
    // Keep the full phrase: "the girl", "my friend", etc.
    const fullPhrase = match[1].toLowerCase();
    people.add(fullPhrase);
  }

  // Pattern 2: Standalone role titles (Coach, Teacher, etc.) - capitalized at start
  const standaloneTitles = [
    "Coach",
    "Teacher",
    "Doctor",
    "Professor",
    "Captain",
    "Sergeant",
    "Officer",
    "Pastor",
    "Father",
    "Mother",
    "Boss",
  ];
  for (const title of standaloneTitles) {
    if (transcript.includes(title)) {
      people.add(title);
    }
  }

  // Pattern 3: Capitalized names with action verbs
  const nameWithVerbPattern =
    /\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)?)\s+(?:said|told|taught|showed|gave|asked|wanted|helped|loved|knew|met|called|kept|started|stopped|was|were|had)/g;
  const nameMatches = Array.from(transcript.matchAll(nameWithVerbPattern));
  for (const match of nameMatches) {
    const name = match[1];
    if (!excludeWords.has(name) && !standaloneTitles.includes(name)) {
      people.add(name);
    }
  }

  // Pattern 3: "with/from [Proper Name]" (ONLY if next word is capitalized)
  const withFromPattern =
    /\b(?:with|from)\s+([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)?)\b/g;
  const withFromMatches = Array.from(transcript.matchAll(withFromPattern));
  for (const match of withFromMatches) {
    const name = match[1];
    // Extra validation: check if it's followed by lowercase or end of sentence
    const matchIndex = match.index! + match[0].length;
    const nextChar = transcript[matchIndex];
    if (
      !excludeWords.has(name) &&
      (!nextChar || nextChar === " " || nextChar === "." || nextChar === ",")
    ) {
      people.add(name);
    }
  }

  // Extract places (prepositions + capitalized locations or specific place nouns)
  const placePatterns = [
    /\b(?:at|in|near|by|to|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
    // Match common place types with optional "the"
    /\b(?:the|a|an)?\s*(hospital room|emergency room|waiting room|operating room|hotel room|living room|dining room|bedroom|classroom|boardroom|courtroom)/gi,
    /\b(?:the)\s+(workshop|office|house|apartment|school|church|hospital|factory|store|shop|restaurant|park|beach|lake|farm|ranch|barn|kitchen|basement|attic|garage|yard|garden|stadium|theater|library|museum)/gi,
  ];

  const places = new Set<string>();
  placePatterns.forEach((pattern, index) => {
    const matches = Array.from(transcript.matchAll(pattern));
    for (const match of matches) {
      const place = match[1];
      if (place && !["The", "I", "We"].includes(place)) {
        // For multi-word places (hospital room), normalize to lowercase
        if (index > 0) {
          // Skip first pattern (capitalized cities)
          places.add(place.toLowerCase());
        } else {
          places.add(place);
        }
      }
    }
  });

  // Extract objects (possessives + concrete nouns)
  const objectPatterns = [
    /\b(?:my|his|her|our|their|the)\s+([\w\s-]+?)\s+(?:that|which|was|were|had|has|sat|hung|stood|lay|came|went|broke|fixed)/gi,
    /\b(?:a|an)\s+([\w\s-]+?)\s+(?:that|which|was|were)/gi,
  ];

  const objects = new Set<string>();
  objectPatterns.forEach((pattern) => {
    const matches = Array.from(normalized.matchAll(pattern));
    for (const match of matches) {
      const obj = match[1].trim();
      // Filter out common words and very short words
      const commonWords = [
        "time",
        "day",
        "year",
        "way",
        "thing",
        "lot",
        "kind",
        "sort",
        "bit",
        "place",
        "moment",
      ];
      if (obj.length > 3 && !commonWords.some((w) => obj.includes(w))) {
        objects.add(obj);
      }
    }
  });

  // Extract emotions
  const emotionWords = [
    "proud",
    "scared",
    "angry",
    "happy",
    "sad",
    "disappointed",
    "excited",
    "nervous",
    "ashamed",
    "relieved",
    "terrified",
    "joyful",
    "anxious",
    "grateful",
    "regretful",
    "confused",
    "frustrated",
    "surprised",
    "shocked",
    "delighted",
    "worried",
  ];

  const emotions = emotionWords.filter((emotion) =>
    normalized.includes(emotion),
  );

  // Extract temporal boundaries
  const temporalPatterns = [/(first|last|only)\s+time/gi];

  const temporalBoundaries: string[] = [];
  temporalPatterns.forEach((pattern) => {
    const matches = Array.from(transcript.matchAll(pattern));
    for (const match of matches) {
      temporalBoundaries.push(match[0]);
    }
  });

  const extracted = {
    people: Array.from(people),
    places: Array.from(places),
    objects: Array.from(objects),
    emotions,
    temporalBoundaries,
  };

  console.log("[Entity Extraction] Results:", {
    people: extracted.people,
    places: extracted.places,
    objects: extracted.objects.slice(0, 3),
    emotions: extracted.emotions,
  });

  return extracted;
}

// ============================================================================
// TEMPLATE LIBRARY
// ============================================================================

const TEMPLATE_LIBRARY: Record<string, PromptTemplate> = {
  person_expansion: {
    trigger: "person_mentioned",
    patterns: [
      "What's the first thing you picture when you think of {person}?",
      "What sound do you associate with {person}?",
      "What did {person}'s hands look like?",
      "What was {person}'s favorite thing to talk about?",
      "When did you last see {person}?",
      "What did {person} always carry with them?",
      "What would {person} say when they walked in the door?",
      "What smell reminds you of {person}?",
      "What was {person}'s favorite chair like?",
      "What made {person} laugh?",
      "What did {person} wear on Sundays?",
      "Where would you find {person} on Saturday mornings?",
      "What did {person} teach you without meaning to?",
      "What was {person}'s signature dish?",
      "What did {person}'s voice sound like?",
    ],
    context: "You mentioned {person}",
    priority: 90,
  },

  object_origin: {
    trigger: "object_mentioned",
    patterns: [
      "What did your {object} smell like?",
      "Where did you keep your {object}?",
      "Who else touched your {object}?",
      "What sound did your {object} make?",
      "When did you stop using your {object}?",
      "What color was your {object}?",
      "Who taught you to use your {object}?",
      "What happened to your {object}?",
      "Where is your {object} now?",
      "What did your {object} feel like in your hands?",
      "Who gave you your {object}?",
      "What did you use your {object} for?",
    ],
    context: "You mentioned {object}",
    priority: 85,
  },

  place_memory: {
    trigger: "place_mentioned",
    patterns: [
      "What did {place} smell like?",
      "What sounds do you remember from {place}?",
      "What was on the walls at {place}?",
      "What did the floor feel like at {place}?",
      "What time of day was best at {place}?",
      "Who else would you see at {place}?",
      "What did you wear to {place}?",
      "How did you get to {place}?",
      "What season do you picture when you think of {place}?",
      "What was the lighting like at {place}?",
      "What did you always do first when you arrived at {place}?",
      "Who taught you about {place}?",
      "What was your favorite spot at {place}?",
      "What did the air feel like at {place}?",
      "When did you last visit {place}?",
    ],
    context: "You mentioned {place}",
    priority: 88,
  },

  emotion_expansion: {
    trigger: "emotion_detected",
    patterns: [
      "What did {emotion} feel like in your chest?",
      "Who could tell when you were {emotion}?",
      "What did you do when you felt {emotion}?",
      "Who made you feel {emotion} another time?",
      "What smell brings back that {emotion} feeling?",
      "Where were you the first time you felt that {emotion}?",
      "What sound do you associate with feeling {emotion}?",
      "Who helped when you felt {emotion}?",
    ],
    context: "You felt {emotion}",
    priority: 75,
  },

  temporal_sequence: {
    trigger: "temporal_boundary",
    patterns: [
      "What happened the day after?",
      "Who did you tell first?",
      "What changed after that?",
      "What were you wearing that day?",
      "What time of year was it?",
      "Who was with you?",
    ],
    context: "You mentioned a {temporal}",
    priority: 70,
  },
};

// ============================================================================
// ANCHOR HASH GENERATION
// ============================================================================

/**
 * Generate SHA1 hash for prompt deduplication
 * Format: sha1(`${type}|${entity}|${year||'NA'}`)
 */
export function generateAnchorHash(
  type: string,
  entity: string,
  year: number | null,
): string {
  const normalized = entity.toLowerCase().trim();
  const yearStr = year ? year.toString() : "NA";
  const input = `${type}|${normalized}|${yearStr}`;

  return createHash("sha1").update(input).digest("hex");
}

// ============================================================================
// TEMPLATE MATCHING
// ============================================================================

/**
 * Generate 1-3 Tier 1 prompts from extracted entities
 * Priority order: people > places > objects > emotions > temporal
 * Returns array of prompts (best 1-3 entities)
 */
export function generateTier1Templates(
  transcript: string,
  storyYear: number | null,
): Tier1Prompt[] {
  const entities = extractEntities(transcript);
  const prompts: Tier1Prompt[] = [];

  console.log("[Tier 1 Template] Generating prompts from entities...");

  // Priority 1: People (most likely to trigger recording) - take top 2
  const peopleToUse = entities.people.slice(0, 2);
  for (const person of peopleToUse) {
    const template = TEMPLATE_LIBRARY.person_expansion;
    const pattern =
      template.patterns[Math.floor(Math.random() * template.patterns.length)];

    prompts.push({
      text: pattern.replace("{person}", person),
      context: template.context.replace("{person}", person),
      entity: person,
      type: "person_expansion",
      anchorHash: generateAnchorHash("person_expansion", person, storyYear),
      tier: 1,
      memoryType: "person_expansion",
      promptScore: 85,
    });
  }

  // Priority 2: Places - take top 1 if we have room
  if (prompts.length < 3 && entities.places.length > 0) {
    const place = entities.places[0];
    const template = TEMPLATE_LIBRARY.place_memory;
    const pattern =
      template.patterns[Math.floor(Math.random() * template.patterns.length)];

    prompts.push({
      text: pattern.replace("{place}", place),
      context: template.context.replace("{place}", place),
      entity: place,
      type: "place_memory",
      anchorHash: generateAnchorHash("place_memory", place, storyYear),
      tier: 1,
      memoryType: "place_memory",
      promptScore: 82,
    });
  }

  // Priority 3: Objects - take top 1 if we have room
  if (prompts.length < 3 && entities.objects.length > 0) {
    const object = entities.objects[0];
    const template = TEMPLATE_LIBRARY.object_origin;
    const pattern =
      template.patterns[Math.floor(Math.random() * template.patterns.length)];

    prompts.push({
      text: pattern.replace("{object}", object),
      context: template.context.replace("{object}", object),
      entity: object,
      type: "object_origin",
      anchorHash: generateAnchorHash("object_origin", object, storyYear),
      tier: 1,
      memoryType: "object_origin",
      promptScore: 80,
    });
  }

  // Priority 4: Emotions - only if nothing else found
  if (prompts.length === 0 && entities.emotions.length > 0) {
    const emotion = entities.emotions[0];
    const template = TEMPLATE_LIBRARY.emotion_expansion;
    const pattern =
      template.patterns[Math.floor(Math.random() * template.patterns.length)];

    prompts.push({
      text: pattern.replace("{emotion}", emotion),
      context: template.context.replace("{emotion}", emotion),
      entity: emotion,
      type: "emotion_expansion",
      anchorHash: generateAnchorHash("emotion_expansion", emotion, storyYear),
      tier: 1,
      memoryType: "emotion_expansion",
      promptScore: 70,
    });
  }

  // Fallback: decade-based generic (only if no other prompts)
  if (prompts.length === 0 && storyYear) {
    const decade = Math.floor(storyYear / 10) * 10;
    prompts.push({
      text: `What was a typical Saturday like in the ${decade}s?`,
      context: `Based on your ${storyYear} story`,
      entity: `${decade}s`,
      type: "decade_context",
      anchorHash: generateAnchorHash("decade_context", `${decade}s`, decade),
      tier: 1,
      memoryType: "decade_fallback",
      promptScore: 60,
    });
  }

  console.log(
    `[Tier 1 Template] Generated ${prompts.length} prompts:`,
    prompts.map((p) => p.entity),
  );

  return prompts;
}
