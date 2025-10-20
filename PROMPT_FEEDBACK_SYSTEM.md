# Prompt Quality Feedback System

A comprehensive dashboard for reviewing AI-generated prompts and collecting training data to improve prompt quality over time.

## 🎯 Purpose

This system allows you to:
1. **Review prompts** - Rate them as good/bad/excellent/terrible
2. **Add context** - Explain why a prompt is good or bad
3. **Tag issues** - Mark common problems (generic, no-context, body-part, etc.)
4. **Export training data** - Download feedback in formats suitable for model fine-tuning

## 📊 Features

### Admin Dashboard
- **URL**: `http://localhost:3002/admin/prompt-feedback`
- **Access**: Admin users only

### Stats Overview
- Total prompts
- Good/Excellent count (green)
- Bad/Terrible count (red)
- Reviewed count
- Needs Review count

### Filtering
- **By Tier**: All, Tier 1, Tier 3
- **By Status**: All, Reviewed Only, Needs Review

### Quick Actions
- 👍 **Good** button - Mark as good (auto-submits)
- 👎 **Bad** button - Opens feedback modal for notes/tags
- **Terrible** - For the worst prompts
- **Excellent** - For exceptional prompts

### Tagging System
Common tags you can apply:
- `generic` - Uses generic nouns (girl, boy, man, woman)
- `no-context` - Missing specific details from story
- `body-part` - References body parts as objects
- `placeholder-response` - Meta-commentary ("seems like a placeholder...")
- `yes-no-question` - Closed question format
- `therapy-speak` - Uses therapeutic language
- `perfect` - Great example for training
- `needs-improvement` - Close but not quite right

## 📥 Export Formats

### 1. JSON (Full Data)
```bash
GET /api/admin/prompts/export?format=json
```

Returns complete feedback records with all metadata:
```json
{
  "success": true,
  "count": 150,
  "exportedAt": "2025-10-20T...",
  "data": [
    {
      "prompt_text": "What did Mark believe about you that turned out to be true?",
      "rating": "excellent",
      "feedback_notes": "Perfect - uses specific name, implies relationship growth",
      "tags": ["perfect"],
      "prompt_tier": 1,
      "prompt_type": "person_expansion",
      "anchor_entity": "Mark",
      "word_count": 10,
      "prompt_score": 85,
      "story_excerpt": "Mark was my mentor at the shop...",
      "reviewed_at": "2025-10-20T..."
    }
  ]
}
```

### 2. CSV (Spreadsheet Analysis)
```bash
GET /api/admin/prompts/export?format=csv
```

Columns:
- prompt_text
- rating
- feedback_notes
- tags
- prompt_tier
- prompt_type
- anchor_entity
- word_count
- prompt_score
- story_excerpt
- reviewed_at

Perfect for:
- Excel/Google Sheets analysis
- Finding patterns in bad prompts
- Sharing with team members

### 3. JSONL (GPT Fine-Tuning)
```bash
GET /api/admin/prompts/export?format=jsonl
```

Format for OpenAI fine-tuning:
```jsonl
{"messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}], "metadata": {...}}
{"messages": [...], "metadata": {...}}
```

**Only includes `good` and `excellent` examples** - these become your training data.

Each line is a complete training example with:
- System message (instructions for prompt generation)
- User message (story excerpt)
- Assistant message (the good prompt)
- Metadata (rating, tags, tier)

## 🔄 Workflow

### Initial Review Phase (Week 1)
1. Record 20-30 stories
2. Let AI generate prompts
3. Visit `/admin/prompt-feedback`
4. Review 50-100 prompts:
   - Quick "Good" for decent prompts
   - "Bad" with notes for problems
   - Tag common issues

### Analysis Phase (Week 2)
1. Export to CSV
2. Analyze patterns:
   - What % are body-part errors?
   - What % lack context?
   - What types work best?
3. Identify top issues

### Improvement Phase (Week 3+)
1. Update quality gates based on feedback
2. Refine regex patterns
3. Adjust system prompts
4. Export JSONL of good examples
5. Optionally: Fine-tune GPT model

## 🗄️ Database Schema

### Table: `prompt_feedback`

```sql
CREATE TABLE prompt_feedback (
  id UUID PRIMARY KEY,
  prompt_id UUID REFERENCES active_prompts(id),
  prompt_text TEXT NOT NULL,
  story_id UUID REFERENCES stories(id),
  story_excerpt TEXT,

  -- Feedback
  rating TEXT CHECK (rating IN ('good', 'bad', 'excellent', 'terrible')),
  feedback_notes TEXT,
  tags TEXT[],

  -- Metadata
  prompt_tier INTEGER,
  prompt_type TEXT,
  anchor_entity TEXT,
  word_count INTEGER,
  prompt_score DECIMAL(5,2),
  quality_report JSONB,

  -- Reviewer
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP DEFAULT NOW(),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🔐 Security

- ✅ Admin-only access (RLS policies)
- ✅ Audit logging (admin_audit_log)
- ✅ Rate limiting
- ✅ JWT authentication required

## 📈 Success Metrics

Track these over time:
1. **Quality Score Trend** - Is avg score improving?
2. **Good/Bad Ratio** - Target: 80% good or better
3. **Top Issue Tags** - What problems are most common?
4. **Review Coverage** - % of prompts reviewed

## 🎓 Using Training Data

### Option 1: Manual Improvement
1. Export CSV
2. Read bad examples
3. Update quality gates manually
4. Test improvements

### Option 2: Few-Shot Learning
1. Export JSONL
2. Add 5-10 best examples to system prompt
3. Model learns from examples

### Option 3: Fine-Tuning (Advanced)
1. Export JSONL (100+ good examples)
2. Upload to OpenAI
3. Fine-tune gpt-4o-mini
4. Use fine-tuned model for Echo prompts

## 🚀 Getting Started

### 1. Run Migration
```bash
cd /Users/paul/Development/HeritageWhisperV2
# Apply the migration
psql $DATABASE_URL < migrations/0003_add_prompt_feedback.sql
```

### 2. Access Dashboard
1. Log in as admin
2. Navigate to `http://localhost:3002/admin/prompt-feedback`
3. Start reviewing prompts!

### 3. Review Workflow
1. Click "Needs Review" filter
2. For each prompt:
   - Click "Good" if it's decent
   - Click "Bad" if problematic → add notes/tags
3. Review 10-20 per session

### 4. Export and Analyze
1. After 50+ reviews, click "CSV" export
2. Open in Excel/Sheets
3. Sort by tags to find patterns
4. Update quality gates based on findings

## 📝 Example Feedback Notes

**Good Examples:**
- "Perfect - uses specific name and implies relationship"
- "Great sensory detail question, very natural"
- "Excellent use of quoted phrase from story"

**Bad Examples:**
- "Uses body part 'chest' as object - makes no sense"
- "Generic 'man' reference, no context from story"
- "Placeholder response - thinks transcript is incomplete"
- "Yes/no question format, not open-ended"

## 🔧 Maintenance

### Weekly Tasks
- Review 20-30 new prompts
- Export CSV and check trends
- Update quality gates if needed

### Monthly Tasks
- Analyze feedback data for patterns
- Update system prompts based on learnings
- Export JSONL for potential fine-tuning

### Quarterly Tasks
- Major quality gate overhaul if needed
- Consider GPT model fine-tuning if data supports it

---

**Questions?** See `CLAUDE.md` for full project documentation.
