# Heritage Whisper Prompting Principles

> **Last Updated:** December 2025
> **Status:** Active - Developer reference for AI prompting
> **See Also:** [AI_PROMPTING.md](../AI_PROMPTING.md) for complete production reference

## What Works (From Interview-Chat V1 Success)

### Core Principle: Focus on Emotional Depth, Not Clever Connections

The V1 follow-up system works because it:
1. **Asks about feelings and impact** - not facts
2. **Uses simple, proven question templates** - not generated patterns
3. **Stays conversational** - not analytical
4. **Higher temperature (0.9)** - allows natural variation
5. **Clear constraints** - 15-25 words, 2-3 questions

## The Five Universal Question Types That Always Work

1. **Emotional Depth**: "How did [specific moment] make you feel?"
2. **Personal Impact**: "How did [experience] change you?"
3. **Reflection**: "Looking back, what surprises you about [moment]?"
4. **Wisdom**: "What would you tell someone facing [similar situation]?"
5. **Relationships**: "How did [event] affect your relationship with [person]?"

## What Fails (And Why)

### ❌ Entity Extraction Without Context
- Extracting "chest" and asking "who else touched it"
- The AI doesn't understand chest=furniture vs chest=body part
- **Fix**: Reference moments, not extracted entities

### ❌ Forced Pattern Matching
- "You did X in story 1 and Y in story 2, therefore Z?"
- Creates nonsensical connections
- **Fix**: Only connect if genuinely related

### ❌ Over-Constrained Responses
- 150 token limits create choppy questions
- Too many "don't do this" rules paralyze the AI
- **Fix**: Guide what TO do, not what NOT to do

### ❌ Trying to Be Too Clever
- "When did legs start meaning more?" (what??)
- Wordplay and abstract connections confuse users
- **Fix**: Simple, direct questions about feelings

## Implementation Guidelines

### For Milestone Prompts (Tier 3)
```javascript
// DON'T: Complex pattern analysis
"Find patterns across stories and generate clever connections"

// DO: Emotional exploration
"What moments from their stories deserve deeper exploration?
 What emotions were left unexplored?
 What people were mentioned but not fully described?"
```

### For Real-time Conversation (Pearl)
```javascript
// DON'T: Rigid rules and restrictions
"One question. Max 2 sentences. Never do X, Y, Z..."

// DO: Natural conversation flow
"Be warm and curious. Ask what you genuinely want to know.
 Help them remember details and feelings."
```

### For Follow-ups (V1 - Keep As Is!)
```javascript
// This already works perfectly - don't change it!
"Generate 2-3 natural follow-up questions based on what they shared.
 Ask about feelings, details, or lessons learned."
```

## Testing Your Prompts

Before deploying, ask yourself:
1. Would a caring friend ask this question?
2. Is it specific to THIS person's story?
3. Does it explore feelings, not just facts?
4. Can it be answered in a story format?
5. Is it clear what you're asking about?

## The Golden Rule

**Stories are about emotions and meaning, not facts and patterns.**

Every prompt should help the user explore:
- How they felt
- Why it mattered
- What it meant to them
- How it changed them
- What they learned

Not:
- Random connections between unrelated things
- Clever wordplay
- Abstract patterns
- Mechanical entity relationships