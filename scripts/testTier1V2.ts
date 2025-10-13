/**
 * Test Tier-1 V2 prompt generation with real story examples
 * Run: npx tsx scripts/testTier1V2.ts
 */

import { generateTier1Templates, extractEntities } from '../lib/promptGenerationV2';

console.log('='.repeat(80));
console.log('TIER-1 V2 PROMPT GENERATION TEST');
console.log('='.repeat(80));

// Test Story 1: Good entities (should generate quality prompts)
console.log('\n📖 TEST 1: Story with worthy entities (Chewy, father, newborn)');
console.log('---');
const story1 = `
I remember getting Chewy, our first dog, right before our daughter was born.
I felt housebroken by love—suddenly responsible for this little creature who
trusted me completely. Those first sleepless nights with a newborn, Chewy
would sit by the nursery door, keeping watch. My father taught me responsibility
through his workshop, but Chewy taught me what it meant to show up even when
exhausted. He taught me that love means choosing duty over comfort.
`;

const entities1 = extractEntities(story1);
console.log('\nExtracted entities:', entities1);

const prompts1 = generateTier1Templates(story1, 2020);
console.log(`\nGenerated ${prompts1.length} prompts:`);
prompts1.forEach((p, i) => {
  console.log(`\n${i + 1}. "${p.text}"`);
  console.log(`   Entity: "${p.entity}" | Type: ${p.memoryType}`);
  console.log(`   Words: ${p.wordCount} | Score: ${p.promptScore}`);
});

// Test Story 2: Generic entities (should filter them out)
console.log('\n\n📖 TEST 2: Story with generic entities (should filter out)');
console.log('---');
const story2 = `
The girl at the hospital said I needed to wait. A man came in and sat in the
chair next to me. The room was cold. I remember the house felt empty when I got
back. Someone told me things would be okay.
`;

const entities2 = extractEntities(story2);
console.log('\nExtracted entities:', entities2);

const prompts2 = generateTier1Templates(story2, 1985);
console.log(`\nGenerated ${prompts2.length} prompts (should be 0 or very few):`);
prompts2.forEach((p, i) => {
  console.log(`\n${i + 1}. "${p.text}"`);
  console.log(`   Entity: "${p.entity}" | Type: ${p.memoryType}`);
});

// Test Story 3: Mixed entities (should filter and keep good ones)
console.log('\n\n📖 TEST 3: Mixed entities (filter generics, keep specific)');
console.log('---');
const story3 = `
Coach Thompson changed my life. The man knew exactly what to say. I felt scared
that first day at practice, but Coach saw something in me. My father's workshop
was where I learned to build things, but Coach's office was where I learned to
believe in myself. The girl who sat next to me didn't understand. But Sarah, my
best friend, she got it. She knew what Coach meant to all of us.
`;

const entities3 = extractEntities(story3);
console.log('\nExtracted entities:', entities3);

const prompts3 = generateTier1Templates(story3, 1975);
console.log(`\nGenerated ${prompts3.length} prompts:`);
prompts3.forEach((p, i) => {
  console.log(`\n${i + 1}. "${p.text}"`);
  console.log(`   Entity: "${p.entity}" | Type: ${p.memoryType}`);
  console.log(`   Words: ${p.wordCount} | Score: ${p.promptScore}`);
});

// Test Story 4: Unique phrases
console.log('\n\n📖 TEST 4: Story with unique phrases (quoted text)');
console.log('---');
const story4 = `
My father always said "measure twice, cut once." I can still hear him. He taught
me that shortcuts cost more than they save. I felt proud when he finally said
"you've got it, son." Those three words meant everything. I never forget the day
he let me use his tools alone for the first time.
`;

const entities4 = extractEntities(story4);
console.log('\nExtracted entities:', entities4);

const prompts4 = generateTier1Templates(story4, 1960);
console.log(`\nGenerated ${prompts4.length} prompts:`);
prompts4.forEach((p, i) => {
  console.log(`\n${i + 1}. "${p.text}"`);
  console.log(`   Entity: "${p.entity}" | Type: ${p.memoryType}`);
  console.log(`   Words: ${p.wordCount} | Score: ${p.promptScore}`);
});

// Validation summary
console.log('\n' + '='.repeat(80));
console.log('VALIDATION SUMMARY');
console.log('='.repeat(80));
console.log(`
✅ Story 1: Should generate prompts about Chewy, father, newborn (specific entities)
✅ Story 2: Should generate 0 prompts (all generic: girl, man, house, room, chair)
✅ Story 3: Should filter out "the girl" and "the man", keep Coach Thompson, Sarah
✅ Story 4: Should extract unique phrases and generate relationship prompts

All prompts should:
- Be under 30 words
- Use specific entity names (not "girl", "man", "room")
- Have conversational, relationship-focused tone
- Pass quality validation
`);

console.log('='.repeat(80));
