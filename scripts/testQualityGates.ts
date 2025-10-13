/**
 * Manual validation script for quality gates
 * Run: npx tsx scripts/testQualityGates.ts
 */

import {
  isWorthyEntity,
  validatePromptQuality,
  scorePromptQuality,
} from '../lib/promptQuality';

console.log('='.repeat(80));
console.log('QUALITY GATES VALIDATION');
console.log('='.repeat(80));

// Test 1: Generic entities (should REJECT)
console.log('\n❌ TEST 1: Generic Entities (should be FALSE)');
console.log('---');
const genericEntities = ['girl', 'boy', 'man', 'woman', 'house', 'room', 'chair', 'the girl', 'a man'];
genericEntities.forEach(entity => {
  const result = isWorthyEntity(entity);
  console.log(`  ${entity}: ${result} ${result === false ? '✓' : '✗ FAIL'}`);
});

// Test 2: Worthy entities (should ACCEPT)
console.log('\n✅ TEST 2: Worthy Entities (should be TRUE)');
console.log('---');
const worthyEntities = ['Chewy', 'my father', "father's workshop", 'Coach Thompson', 'Sarah', 'my blue Chevelle'];
worthyEntities.forEach(entity => {
  const result = isWorthyEntity(entity);
  console.log(`  ${entity}: ${result} ${result === true ? '✓' : '✗ FAIL'}`);
});

// Test 3: Bad prompts (should REJECT)
console.log('\n❌ TEST 3: Bad Prompts (should be FALSE)');
console.log('---');
const badPrompts = [
  "What's the clearest memory you have of Girl?",
  "In your story about 1985, what happened?",
  "Tell me more about that.",
  "How did that make you feel?",
  "Did you love your father?", // yes/no question
];
badPrompts.forEach(prompt => {
  const result = validatePromptQuality(prompt);
  console.log(`  "${prompt}"`);
  console.log(`  Result: ${result} ${result === false ? '✓' : '✗ FAIL'}\n`);
});

// Test 4: Good prompts (should ACCEPT)
console.log('\n✅ TEST 4: Good Prompts (should be TRUE)');
console.log('---');
const goodPrompts = [
  "You said 'housebroken by love.' What freedom did you trade for that feeling?",
  "When did you first see your father differently than before?",
  "You sacrifice for family in every story. When did you learn that's what love means?",
  "What line did Coach say that you still hear today?",
];
goodPrompts.forEach(prompt => {
  const result = validatePromptQuality(prompt);
  const wordCount = prompt.split(/\s+/).length;
  const score = scorePromptQuality(prompt, { usesExactPhrase: prompt.includes("'") || prompt.includes('"') });
  console.log(`  "${prompt}"`);
  console.log(`  Result: ${result} (${wordCount} words, score: ${score}) ${result === true ? '✓' : '✗ FAIL'}\n`);
});

// Test 5: Word count validation
console.log('\n📏 TEST 5: Word Count (30 max)');
console.log('---');
const longPrompt = "This is a very long prompt that goes on and on and on and has way too many words to be considered a high quality prompt for our storytelling application and should definitely be rejected";
const wordCount = longPrompt.split(/\s+/).length;
const result = validatePromptQuality(longPrompt);
console.log(`  Prompt with ${wordCount} words: ${result} ${result === false ? '✓' : '✗ FAIL'}`);

const shortPrompt = "You felt 'housebroken by love.' What freedom did you trade?";
const shortWordCount = shortPrompt.split(/\s+/).length;
const shortResult = validatePromptQuality(shortPrompt);
console.log(`  Prompt with ${shortWordCount} words: ${shortResult} ${shortResult === true ? '✓' : '✗ FAIL'}`);

// Test 6: Scoring
console.log('\n⭐ TEST 6: Scoring Algorithm');
console.log('---');
const scoringTests = [
  { prompt: "Test prompt", expected: "~50 (base)" },
  { prompt: "You felt scared and learned courage", expected: ">50 (depth signals)" },
  { prompt: "You said 'never again' and meant it", metadata: { usesExactPhrase: true }, expected: ">70 (exact phrase)" },
  { prompt: "What did the girl teach you?", expected: "<50 (generic penalty)" },
];

scoringTests.forEach(test => {
  const score = scorePromptQuality(test.prompt, test.metadata);
  console.log(`  "${test.prompt}"`);
  console.log(`  Score: ${score} (expected ${test.expected})\n`);
});

console.log('='.repeat(80));
console.log('VALIDATION COMPLETE');
console.log('='.repeat(80));
