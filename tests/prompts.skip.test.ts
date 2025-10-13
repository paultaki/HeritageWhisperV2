/**
 * Tests for POST /api/prompts/skip
 * 
 * Scenarios:
 * 1. Returns 401 when no Authorization header
 * 2. Returns 404 when promptId not found for user
 * 3. Increments skip_count by 1 on first skip
 * 4. Archives to prompt_history and removes from active_prompts on 3rd skip
 * 5. Returns next prompt after skipping
 * 6. Handles skipping by promptText instead of promptId
 * 7. Falls back to shown_count when skip_count doesn't exist
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as postSkip } from '@/app/api/prompts/skip/route';
import { GET as getNext } from '@/app/api/prompts/next/route';
import { db, seedDb } from './mocks/supabaseAdmin.mock';
import { createPostRequest, futureDate } from './utils';

// Mock global fetch to intercept calls to /api/prompts/next
beforeEach(() => {
  global.fetch = vi.fn(async (url: string | URL | Request, options?: RequestInit) => {
    if (url.toString().includes('/api/prompts/next')) {
      // Call the actual GET handler
      const req = new (await import('next/server')).NextRequest(url.toString(), {
        headers: options?.headers as HeadersInit,
      });
      const response = await getNext(req);
      return response;
    }
    return new Response('Not Found', { status: 404 });
  });
});

describe('POST /api/prompts/skip', () => {
  it('returns 401 when no Authorization header', async () => {
    const req = new (await import('next/server')).NextRequest(
      'http://localhost/api/prompts/skip',
      {
        method: 'POST',
        body: JSON.stringify({ promptId: 'P1' }),
      }
    );
    const res = await postSkip(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/authentication/i);
  });

  it('returns 404 when promptId not found for user', async () => {
    const req = createPostRequest('http://localhost/api/prompts/skip', {
      promptId: 'NONEXISTENT',
    });
    const res = await postSkip(req);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toMatch(/not found/i);
  });

  it('increments skip_count by 1 on first skip', async () => {
    seedDb({
      active_prompts: [
        {
          id: 'P1',
          user_id: 'U1',
          prompt_text: 'Who taught you perseverance?',
          tier: 1,
          prompt_score: 80,
          is_locked: false,
          skip_count: 0,
          shown_count: 0,
          expires_at: futureDate(7),
        },
        {
          id: 'P2',
          user_id: 'U1',
          prompt_text: 'What moment changed everything?',
          tier: 1,
          prompt_score: 75,
          is_locked: false,
          skip_count: 0,
          shown_count: 0,
          expires_at: futureDate(7),
        },
      ],
    });

    const req = createPostRequest('http://localhost/api/prompts/skip', {
      promptId: 'P1',
    });
    const res = await postSkip(req);
    expect(res.status).toBe(200);
    
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.retired).toBe(false);
    expect(json.nextPrompt).toBeDefined();
    
    // Check that skip_count was incremented
    const prompt = db.active_prompts.find((p) => p.id === 'P1');
    expect(prompt).toBeDefined();
    expect(prompt?.skip_count).toBe(1);
  });

  it('increments skip_count to 2 on second skip without retiring', async () => {
    seedDb({
      active_prompts: [
        {
          id: 'P1',
          user_id: 'U1',
          prompt_text: 'Who taught you perseverance?',
          tier: 1,
          prompt_score: 80,
          is_locked: false,
          skip_count: 1, // Already skipped once
          shown_count: 0,
          expires_at: futureDate(7),
        },
      ],
    });

    const req = createPostRequest('http://localhost/api/prompts/skip', {
      promptId: 'P1',
    });
    const res = await postSkip(req);
    expect(res.status).toBe(200);
    
    const json = await res.json();
    expect(json.retired).toBe(false);
    
    const prompt = db.active_prompts.find((p) => p.id === 'P1');
    expect(prompt?.skip_count).toBe(2);
  });

  it('archives to prompt_history and removes from active_prompts on 3rd skip', async () => {
    seedDb({
      active_prompts: [
        {
          id: 'P1',
          user_id: 'U1',
          prompt_text: 'Who taught you perseverance?',
          tier: 1,
          prompt_score: 80,
          is_locked: false,
          skip_count: 2, // Already skipped twice
          shown_count: 0,
          expires_at: futureDate(7),
          created_at: new Date('2024-01-01').toISOString(),
        },
        {
          id: 'P2',
          user_id: 'U1',
          prompt_text: 'What moment changed everything?',
          tier: 1,
          prompt_score: 75,
          is_locked: false,
          skip_count: 0,
          shown_count: 0,
          expires_at: futureDate(7),
        },
      ],
    });

    const req = createPostRequest('http://localhost/api/prompts/skip', {
      promptId: 'P1',
    });
    const res = await postSkip(req);
    expect(res.status).toBe(200);
    
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.retired).toBe(true);
    expect(json.nextPrompt).toBeDefined();
    expect(json.nextPrompt.id).toBe('P2'); // Should return next prompt
    
    // Verify prompt was removed from active_prompts
    const activePrompt = db.active_prompts.find((p) => p.id === 'P1');
    expect(activePrompt).toBeUndefined();
    
    // Verify prompt was archived to prompt_history
    const historyEntry = db.prompt_history.find((p) => p.prompt_id === 'P1');
    expect(historyEntry).toBeDefined();
    expect(historyEntry).toMatchObject({
      user_id: 'U1',
      prompt_text: 'Who taught you perseverance?',
      outcome: 'skipped',
      skip_count: 3,
      tier: 1,
    });
  });

  it('skips by promptText instead of promptId', async () => {
    seedDb({
      active_prompts: [
        {
          id: 'P1',
          user_id: 'U1',
          prompt_text: 'Who taught you perseverance?',
          tier: 1,
          prompt_score: 80,
          is_locked: false,
          skip_count: 0,
          shown_count: 0,
          expires_at: futureDate(7),
        },
      ],
    });

    const req = createPostRequest('http://localhost/api/prompts/skip', {
      promptText: 'Who taught you perseverance?',
    });
    const res = await postSkip(req);
    expect(res.status).toBe(200);
    
    const json = await res.json();
    expect(json.success).toBe(true);
    
    const prompt = db.active_prompts.find((p) => p.prompt_text === 'Who taught you perseverance?');
    expect(prompt?.skip_count).toBe(1);
  });

  it('falls back to shown_count when skip_count does not exist', async () => {
    seedDb({
      active_prompts: [
        {
          id: 'P1',
          user_id: 'U1',
          prompt_text: 'What lesson did you learn?',
          tier: 1,
          prompt_score: 80,
          is_locked: false,
          shown_count: 0, // No skip_count field
          expires_at: futureDate(7),
        },
      ],
    });

    const req = createPostRequest('http://localhost/api/prompts/skip', {
      promptId: 'P1',
    });
    const res = await postSkip(req);
    expect(res.status).toBe(200);
    
    const json = await res.json();
    expect(json.success).toBe(true);
    
    // Should increment shown_count instead
    const prompt = db.active_prompts.find((p) => p.id === 'P1');
    expect(prompt?.shown_count).toBe(1);
  });

  it('returns 400 when neither promptId nor promptText is provided', async () => {
    const req = createPostRequest('http://localhost/api/prompts/skip', {});
    const res = await postSkip(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/required/i);
  });

  it('sets last_shown_at timestamp when skipping', async () => {
    const beforeTime = new Date();
    
    seedDb({
      active_prompts: [
        {
          id: 'P1',
          user_id: 'U1',
          prompt_text: 'What shaped your character?',
          tier: 1,
          prompt_score: 80,
          is_locked: false,
          skip_count: 0,
          shown_count: 0,
          expires_at: futureDate(7),
          last_shown_at: null,
        },
      ],
    });

    const req = createPostRequest('http://localhost/api/prompts/skip', {
      promptId: 'P1',
    });
    await postSkip(req);
    
    const prompt = db.active_prompts.find((p) => p.id === 'P1');
    expect(prompt?.last_shown_at).toBeTruthy();
    expect(new Date(prompt!.last_shown_at!).getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
  });

  it('handles multiple sequential skips correctly', async () => {
    seedDb({
      active_prompts: [
        {
          id: 'P1',
          user_id: 'U1',
          prompt_text: 'First prompt to skip.',
          tier: 1,
          prompt_score: 80,
          is_locked: false,
          skip_count: 0,
          shown_count: 0,
          expires_at: futureDate(7),
        },
      ],
    });

    // Skip 1
    let req = createPostRequest('http://localhost/api/prompts/skip', { promptId: 'P1' });
    let res = await postSkip(req);
    let json = await res.json();
    expect(json.retired).toBe(false);
    expect(db.active_prompts.find((p) => p.id === 'P1')?.skip_count).toBe(1);

    // Skip 2
    req = createPostRequest('http://localhost/api/prompts/skip', { promptId: 'P1' });
    res = await postSkip(req);
    json = await res.json();
    expect(json.retired).toBe(false);
    expect(db.active_prompts.find((p) => p.id === 'P1')?.skip_count).toBe(2);

    // Skip 3 - should retire
    req = createPostRequest('http://localhost/api/prompts/skip', { promptId: 'P1' });
    res = await postSkip(req);
    json = await res.json();
    expect(json.retired).toBe(true);
    expect(db.active_prompts.find((p) => p.id === 'P1')).toBeUndefined();
    expect(db.prompt_history.find((p) => p.prompt_id === 'P1')).toBeDefined();
  });
});
