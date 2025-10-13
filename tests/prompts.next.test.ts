/**
 * Tests for GET /api/prompts/next
 * 
 * Scenarios:
 * 1. Returns 401 when no Authorization header
 * 2. Returns 401 when token is invalid
 * 3. Returns top existing active prompt (unlocked, not expired, validated)
 * 4. Filters out prompts with forbidden words or >30 words
 * 5. Generates Tier-1 prompt from latest story when no valid existing prompts
 * 6. Returns decade fallback when no stories exist
 * 7. Handles expired prompts gracefully
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from '@/app/api/prompts/next/route';
import { db, seedDb } from './mocks/supabaseAdmin.mock';
import { createAuthRequest, futureDate, pastDate } from './utils';

describe('GET /api/prompts/next', () => {
  it('returns 401 when no Authorization header', async () => {
    const req = new (await import('next/server')).NextRequest(
      'http://localhost/api/prompts/next'
    );
    const res = await GET(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/authentication/i);
  });

  it('returns 401 when token is invalid', async () => {
    const req = createAuthRequest('http://localhost/api/prompts/next', 'INVALID');
    const res = await GET(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/authentication/i);
  });

  it('returns top existing active prompt with highest tier and score', async () => {
    // Seed multiple valid prompts with different tiers and scores
    seedDb({
      active_prompts: [
        {
          id: 'P1',
          user_id: 'U1',
          prompt_text: 'Who taught you the value of persistence?',
          tier: 1,
          prompt_score: 75,
          is_locked: false,
          expires_at: futureDate(7),
        },
        {
          id: 'P2',
          user_id: 'U1',
          prompt_text: 'What lesson from childhood still guides you?',
          tier: 3,
          prompt_score: 90,
          is_locked: false,
          expires_at: futureDate(5),
        },
        {
          id: 'P3',
          user_id: 'U1',
          prompt_text: 'When did you first understand sacrifice?',
          tier: 1,
          prompt_score: 80,
          is_locked: false,
          expires_at: futureDate(3),
        },
      ],
    });

    const req = createAuthRequest('http://localhost/api/prompts/next');
    const res = await GET(req);
    expect(res.status).toBe(200);
    
    const json = await res.json();
    expect(json.prompt).toBeDefined();
    expect(json.prompt.id).toBe('P2'); // Tier 3 with score 90 should win
    expect(json.prompt.tier).toBe(3);
  });

  it('filters out prompts with forbidden words (generic nouns)', async () => {
    seedDb({
      active_prompts: [
        {
          id: 'P1',
          user_id: 'U1',
          prompt_text: 'Tell me about the girl who changed your life?', // Contains "girl"
          tier: 3,
          prompt_score: 95,
          is_locked: false,
          expires_at: futureDate(7),
        },
        {
          id: 'P2',
          user_id: 'U1',
          prompt_text: 'What did you learn in that old house?', // Contains "house"
          tier: 2,
          prompt_score: 85,
          is_locked: false,
          expires_at: futureDate(7),
        },
        {
          id: 'P3',
          user_id: 'U1',
          prompt_text: 'Who showed you what courage really means?', // Valid
          tier: 1,
          prompt_score: 70,
          is_locked: false,
          expires_at: futureDate(7),
        },
      ],
    });

    const req = createAuthRequest('http://localhost/api/prompts/next');
    const res = await GET(req);
    expect(res.status).toBe(200);
    
    const json = await res.json();
    expect(json.prompt.id).toBe('P3'); // Only valid prompt
    expect(json.prompt.prompt_text).not.toMatch(/\b(girl|boy|man|woman|house|room|chair)\b/i);
  });

  it('filters out prompts longer than 30 words', async () => {
    seedDb({
      active_prompts: [
        {
          id: 'P1',
          user_id: 'U1',
          prompt_text: 'This is a very long prompt that contains way more than thirty words and should be filtered out by the validation logic because it exceeds the maximum word count limit that we have set for quality prompts in our system which is exactly thirty words maximum',
          tier: 3,
          prompt_score: 95,
          is_locked: false,
          expires_at: futureDate(7),
        },
        {
          id: 'P2',
          user_id: 'U1',
          prompt_text: 'What moment taught you the most?', // Only 6 words - valid
          tier: 1,
          prompt_score: 70,
          is_locked: false,
          expires_at: futureDate(7),
        },
      ],
    });

    const req = createAuthRequest('http://localhost/api/prompts/next');
    const res = await GET(req);
    expect(res.status).toBe(200);
    
    const json = await res.json();
    expect(json.prompt.id).toBe('P2');
    expect(json.prompt.prompt_text.split(/\s+/).length).toBeLessThanOrEqual(30);
  });

  it('generates Tier-1 prompt from latest story when no valid existing prompts', async () => {
    // No active prompts, but user has stories
    seedDb({
      stories: [
        {
          id: 'S1',
          user_id: 'U1',
          story_text: "Chewy taught me responsibility. I felt 'housebroken by love' when he came into my life.",
          story_year: 2005,
          emotions: ['love', 'responsibility'],
          entities: [
            { kind: 'person', text: 'Chewy' },
          ],
          created_at: new Date('2024-01-15').toISOString(),
        },
        {
          id: 'S2',
          user_id: 'U1',
          story_text: 'Working in the workshop with Dad was peaceful.',
          story_year: 1995,
          emotions: ['peace'],
          entities: [
            { kind: 'person', text: 'Dad' },
            { kind: 'place', text: 'workshop' },
          ],
          created_at: new Date('2024-01-10').toISOString(),
        },
      ],
    });

    const req = createAuthRequest('http://localhost/api/prompts/next');
    const res = await GET(req);
    expect(res.status).toBe(200);
    
    const json = await res.json();
    expect(json.prompt).toBeDefined();
    expect(json.prompt.tier).toBe(1);
    expect(json.prompt.prompt_text).toBeTruthy();
    expect(json.prompt.prompt_text.split(/\s+/).length).toBeLessThanOrEqual(30);
    
    // Should be inserted into active_prompts
    const insertedPrompt = db.active_prompts.find((p) => p.user_id === 'U1');
    expect(insertedPrompt).toBeDefined();
    expect(insertedPrompt?.tier).toBe(1);
    expect(insertedPrompt?.is_locked).toBe(false);
  });

  it('returns decade fallback when no stories exist for user', async () => {
    // No active prompts, no stories
    const req = createAuthRequest('http://localhost/api/prompts/next');
    const res = await GET(req);
    expect(res.status).toBe(200);
    
    const json = await res.json();
    expect(json.prompt).toBeDefined();
    expect(json.prompt.tier).toBe(0);
    expect(json.prompt.id).toBeNull();
    expect(json.prompt.prompt_text).toMatch(/\d{4}s/); // Should mention a decade like "1980s"
    expect(json.prompt.anchor_entity).toMatch(/\d{4}s/);
  });

  it('skips expired prompts and generates new one', async () => {
    seedDb({
      active_prompts: [
        {
          id: 'P1',
          user_id: 'U1',
          prompt_text: 'This prompt has expired.',
          tier: 3,
          prompt_score: 95,
          is_locked: false,
          expires_at: pastDate(2), // Expired 2 days ago
        },
      ],
      stories: [
        {
          id: 'S1',
          user_id: 'U1',
          story_text: 'Chewy was my best friend and teacher.',
          story_year: 2005,
          emotions: ['love'],
          entities: [{ kind: 'person', text: 'Chewy' }],
          created_at: new Date().toISOString(),
        },
      ],
    });

    const req = createAuthRequest('http://localhost/api/prompts/next');
    const res = await GET(req);
    expect(res.status).toBe(200);
    
    const json = await res.json();
    expect(json.prompt).toBeDefined();
    // Should not return the expired prompt
    expect(json.prompt.id).not.toBe('P1');
  });

  it('respects is_locked flag and skips locked prompts', async () => {
    seedDb({
      active_prompts: [
        {
          id: 'P1',
          user_id: 'U1',
          prompt_text: 'This prompt is locked.',
          tier: 3,
          prompt_score: 95,
          is_locked: true, // Locked
          expires_at: futureDate(7),
        },
        {
          id: 'P2',
          user_id: 'U1',
          prompt_text: 'What lesson did you learn?',
          tier: 1,
          prompt_score: 70,
          is_locked: false,
          expires_at: futureDate(7),
        },
      ],
    });

    const req = createAuthRequest('http://localhost/api/prompts/next');
    const res = await GET(req);
    expect(res.status).toBe(200);
    
    const json = await res.json();
    expect(json.prompt.id).toBe('P2'); // Should skip locked P1
  });

  it('returns prompt with correct schema structure', async () => {
    seedDb({
      active_prompts: [
        {
          id: 'P1',
          user_id: 'U1',
          prompt_text: 'Who taught you to persevere?',
          tier: 1,
          prompt_score: 75,
          is_locked: false,
          expires_at: futureDate(7),
          shown_count: 0,
          skip_count: 0,
          source_story_id: 'S1',
        },
      ],
    });

    const req = createAuthRequest('http://localhost/api/prompts/next');
    const res = await GET(req);
    const json = await res.json();
    
    expect(json.prompt).toMatchObject({
      id: expect.any(String),
      user_id: 'U1',
      prompt_text: expect.any(String),
      tier: expect.any(Number),
      prompt_score: expect.any(Number),
      is_locked: false,
      expires_at: expect.any(String),
    });
  });
});
