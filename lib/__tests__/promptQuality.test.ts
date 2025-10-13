/**
 * Tests for Prompt Quality Gates
 * 
 * Validates that our quality gates correctly:
 * - Reject generic entities (girl, boy, man, chair)
 * - Reject robotic phrasing ("in your story about")
 * - Reject therapy-speak ("how did that make you feel")
 * - Accept high-quality prompts with specific details
 * - Enforce 30-word limit
 */

import {
  isWorthyEntity,
  validatePromptQuality,
  scorePromptQuality,
} from '../promptQuality';

describe('isWorthyEntity', () => {
  describe('REJECTS generic nouns', () => {
    test('rejects standalone generic words', () => {
      expect(isWorthyEntity('girl')).toBe(false);
      expect(isWorthyEntity('boy')).toBe(false);
      expect(isWorthyEntity('man')).toBe(false);
      expect(isWorthyEntity('woman')).toBe(false);
      expect(isWorthyEntity('house')).toBe(false);
      expect(isWorthyEntity('room')).toBe(false);
      expect(isWorthyEntity('chair')).toBe(false);
      expect(isWorthyEntity('place')).toBe(false);
      expect(isWorthyEntity('thing')).toBe(false);
    });

    test('rejects generic phrases with articles', () => {
      expect(isWorthyEntity('the girl')).toBe(false);
      expect(isWorthyEntity('a man')).toBe(false);
      expect(isWorthyEntity('the house')).toBe(false);
      expect(isWorthyEntity('the room')).toBe(false);
    });
  });

  describe('ACCEPTS specific entities', () => {
    test('accepts proper names', () => {
      expect(isWorthyEntity('Chewy')).toBe(true);
      expect(isWorthyEntity('Sarah')).toBe(true);
      expect(isWorthyEntity('Coach Thompson')).toBe(true);
      expect(isWorthyEntity('Mary Ellen')).toBe(true);
    });

    test('accepts possessive + family role', () => {
      expect(isWorthyEntity('my father')).toBe(true);
      expect(isWorthyEntity('his mother')).toBe(true);
      expect(isWorthyEntity('her brother')).toBe(true);
      expect(isWorthyEntity('my dad')).toBe(true);
    });

    test('accepts possessive phrases', () => {
      expect(isWorthyEntity("father's workshop")).toBe(true);
      expect(isWorthyEntity("Coach's office")).toBe(true);
      expect(isWorthyEntity('my blue Chevelle')).toBe(true);
    });

    test('accepts specific compound nouns', () => {
      expect(isWorthyEntity('old workbench')).toBe(true);
      expect(isWorthyEntity('family brownstone')).toBe(true);
      expect(isWorthyEntity('Ridge Trail')).toBe(true);
    });

    test('accepts specific objects', () => {
      expect(isWorthyEntity('Chevy Camaro')).toBe(true);
      expect(isWorthyEntity('Harley Davidson')).toBe(true);
      expect(isWorthyEntity('workshop')).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('handles null/undefined/empty', () => {
      expect(isWorthyEntity(null)).toBe(false);
      expect(isWorthyEntity(undefined)).toBe(false);
      expect(isWorthyEntity('')).toBe(false);
      expect(isWorthyEntity('   ')).toBe(false);
    });
  });
});

describe('validatePromptQuality', () => {
  describe('REJECTS low-quality prompts', () => {
    test('rejects prompts with generic nouns', () => {
      expect(validatePromptQuality("What's the clearest memory you have of Girl?")).toBe(false);
      expect(validatePromptQuality("Tell me about the man you met.")).toBe(false);
      expect(validatePromptQuality("What did the room look like?")).toBe(false);
      expect(validatePromptQuality("Who was sitting in the chair?")).toBe(false);
    });

    test('rejects robotic phrasing', () => {
      expect(validatePromptQuality("In your story about 1985, what happened next?")).toBe(false);
      expect(validatePromptQuality("You mentioned in your story about your father...")).toBe(false);
      expect(validatePromptQuality("Tell me more about that experience.")).toBe(false);
      expect(validatePromptQuality("What else do you remember?")).toBe(false);
    });

    test('rejects therapy-speak', () => {
      expect(validatePromptQuality("How did that make you feel?")).toBe(false);
      expect(validatePromptQuality("What's the clearest memory you have?")).toBe(false);
    });

    test('rejects yes/no questions', () => {
      expect(validatePromptQuality("Did you love your father?")).toBe(false);
      expect(validatePromptQuality("Was that a difficult time?")).toBe(false);
      expect(validatePromptQuality("Were you scared?")).toBe(false);
      expect(validatePromptQuality("Do you remember the house?")).toBe(false);
    });

    test('rejects prompts over 30 words', () => {
      const longPrompt = "This is a very long prompt that goes on and on and on and has way too many words to be considered a high quality prompt for our storytelling application and should definitely be rejected";
      expect(validatePromptQuality(longPrompt)).toBe(false);
    });

    test('rejects empty/null prompts', () => {
      expect(validatePromptQuality(null)).toBe(false);
      expect(validatePromptQuality(undefined)).toBe(false);
      expect(validatePromptQuality('')).toBe(false);
      expect(validatePromptQuality('   ')).toBe(false);
    });
  });

  describe('ACCEPTS high-quality prompts', () => {
    test('accepts prompts with specific details', () => {
      expect(validatePromptQuality("You said 'housebroken by love.' What freedom did you trade for that feeling?")).toBe(true);
      expect(validatePromptQuality("When did you first see your father differently than before?")).toBe(true);
      expect(validatePromptQuality("What line did Coach say that you still hear today?")).toBe(true);
    });

    test('accepts prompts with emotional depth', () => {
      expect(validatePromptQuality("You felt scared but stayed anyway. Where did you learn that courage?")).toBe(true);
      expect(validatePromptQuality("You chose duty over desire. When did that start?")).toBe(true);
      expect(validatePromptQuality("What did Chewy teach you that truly stuck?")).toBe(true);
    });

    test('accepts prompts about patterns', () => {
      expect(validatePromptQuality("You sacrifice for family in every story. When did you learn that's what love means?")).toBe(true);
      expect(validatePromptQuality("You keep choosing work over play. What changed after that first choice?")).toBe(true);
    });

    test('accepts prompts about absence', () => {
      expect(validatePromptQuality("You mention Mom's strength five times but never mention Dad. What's his story?")).toBe(true);
      expect(validatePromptQuality("Nothing about your twenties appears. What happened then?")).toBe(true);
    });

    test('accepts prompts under 30 words', () => {
      const prompt = "You gained the promotion but lost time with your daughter. When did you realize the price?";
      expect(validatePromptQuality(prompt)).toBe(true);
      expect(prompt.split(/\s+/).length).toBeLessThanOrEqual(30);
    });
  });
});

describe('scorePromptQuality', () => {
  test('scores prompts with exact phrases higher', () => {
    const withQuote = scorePromptQuality("You said 'housebroken by love.' What freedom did you trade?", {
      usesExactPhrase: true
    });
    const withoutQuote = scorePromptQuality("You felt housebroken. What freedom did you trade?");
    
    expect(withQuote).toBeGreaterThan(withoutQuote);
  });

  test('scores prompts referencing multiple stories higher', () => {
    const multiStory = scorePromptQuality("You sacrifice for family in every story. When did that start?", {
      referencesMultipleStories: true
    });
    const singleStory = scorePromptQuality("You sacrificed for family. When did that start?");
    
    expect(multiStory).toBeGreaterThan(singleStory);
  });

  test('scores prompts about absence higher', () => {
    const absence = scorePromptQuality("You never mention your spouse. What's that story?", {
      asksAboutAbsence: true
    });
    const normal = scorePromptQuality("Tell me about your spouse.");
    
    expect(absence).toBeGreaterThan(normal);
  });

  test('penalizes generic nouns', () => {
    const generic = scorePromptQuality("What did the girl teach you?");
    const specific = scorePromptQuality("What did Sarah teach you?");
    
    expect(specific).toBeGreaterThan(generic);
  });

  test('scores are in valid range 0-100', () => {
    const scores = [
      scorePromptQuality("Test prompt"),
      scorePromptQuality("Test prompt with felt and learned"),
      scorePromptQuality("Test with 'exact phrase' reference", { usesExactPhrase: true }),
    ];

    scores.forEach(score => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});

describe('Quality Gates Integration', () => {
  test('Complete workflow: entity extraction -> validation -> scoring', () => {
    // Good entity
    const goodEntity = "my father's workshop";
    expect(isWorthyEntity(goodEntity)).toBe(true);
    
    // Good prompt using that entity
    const goodPrompt = "What did your father's workshop smell like on Sunday mornings?";
    expect(validatePromptQuality(goodPrompt)).toBe(true);
    
    const score = scorePromptQuality(goodPrompt);
    expect(score).toBeGreaterThan(50); // Should score above base
  });

  test('Rejects full pipeline with generic entity', () => {
    // Bad entity
    const badEntity = "the girl";
    expect(isWorthyEntity(badEntity)).toBe(false);
    
    // Bad prompt using generic noun
    const badPrompt = "What do you remember about the girl?";
    expect(validatePromptQuality(badPrompt)).toBe(false);
    
    // Even if we score it, it should be penalized
    const score = scorePromptQuality(badPrompt);
    expect(score).toBeLessThan(50); // Penalized below base
  });
});
