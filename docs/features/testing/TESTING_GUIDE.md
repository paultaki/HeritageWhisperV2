# Testing Guide - Prompt API Endpoints

Complete test suite for `/api/prompts/next` and `/api/prompts/skip` endpoints.

## Installation

```bash
npm install -D vitest
```

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run specific test file
npm test tests/prompts.next.test.ts
npm test tests/prompts.skip.test.ts
```

## Test Structure

### Files Created

- **`vitest.config.ts`** - Vitest configuration with path aliases
- **`tests/setup.ts`** - Global test setup (mocks, beforeEach hooks)
- **`tests/mocks/supabaseAdmin.mock.ts`** - In-memory Supabase client mock
- **`tests/utils.ts`** - Helper functions (createAuthRequest, seedDb, etc.)
- **`tests/prompts.next.test.ts`** - Tests for GET /api/prompts/next
- **`tests/prompts.skip.test.ts`** - Tests for POST /api/prompts/skip

### Test Coverage

#### GET /api/prompts/next (10 tests)

✅ Returns 401 when no Authorization header
✅ Returns 401 when token is invalid  
✅ Returns top existing active prompt (highest tier + score)
✅ Filters out prompts with forbidden words (girl, boy, man, woman, house, etc.)
✅ Filters out prompts longer than 30 words
✅ Generates Tier-1 prompt from latest story when no valid existing prompts
✅ Returns decade fallback when no stories exist
✅ Skips expired prompts and generates new one
✅ Respects is_locked flag
✅ Returns prompt with correct schema structure

#### POST /api/prompts/skip (10 tests)

✅ Returns 401 when no Authorization header
✅ Returns 404 when promptId not found  
✅ Increments skip_count by 1 on first skip
✅ Increments skip_count to 2 on second skip without retiring
✅ Archives to prompt_history and removes from active_prompts on 3rd skip
✅ Skips by promptText instead of promptId
✅ Falls back to shown_count when skip_count doesn't exist
✅ Returns 400 when neither promptId nor promptText provided
✅ Sets last_shown_at timestamp when skipping
✅ Handles multiple sequential skips correctly

## How It Works

### In-Memory Database

Tests use an in-memory database that mimics Supabase behavior:

```typescript
const db = {
  users: [{ id: 'U1', birth_year: 1980 }],
  active_prompts: [],
  prompt_history: [],
  stories: [],
};
```

### Authentication Mock

- Token `'VALID'` → Returns user with id `'U1'`
- Any other token → Returns authentication error

### Seeding Test Data

```typescript
import { seedDb } from './mocks/supabaseAdmin.mock';

seedDb({
  active_prompts: [
    {
      id: 'P1',
      user_id: 'U1',
      prompt_text: 'Who taught you perseverance?',
      tier: 1,
      prompt_score: 80,
      is_locked: false,
      expires_at: futureDate(7),
    },
  ],
});
```

### Helper Functions

```typescript
// Create authenticated request
const req = createAuthRequest('http://localhost/api/prompts/next');

// Create POST request with body
const req = createPostRequest('http://localhost/api/prompts/skip', {
  promptId: 'P1',
});

// Future date (7 days from now)
const expires = futureDate(7);

// Past date (2 days ago)
const expired = pastDate(2);
```

## Key Testing Patterns

### Arrange-Act-Assert

```typescript
it('returns top existing active prompt', async () => {
  // ARRANGE: Seed database
  seedDb({
    active_prompts: [
      { id: 'P1', tier: 1, prompt_score: 75, ... },
      { id: 'P2', tier: 3, prompt_score: 90, ... },
    ],
  });

  // ACT: Call the endpoint
  const req = createAuthRequest('http://localhost/api/prompts/next');
  const res = await GET(req);

  // ASSERT: Verify response
  const json = await res.json();
  expect(json.prompt.id).toBe('P2'); // Tier 3 wins
});
```

### Testing Skip Flow

```typescript
// Skip 3 times to trigger retirement
for (let i = 0; i < 3; i++) {
  const req = createPostRequest('http://localhost/api/prompts/skip', {
    promptId: 'P1',
  });
  const res = await postSkip(req);
  const json = await res.json();
  
  if (i === 2) {
    expect(json.retired).toBe(true);
    expect(db.prompt_history).toHaveLength(1);
  }
}
```

## Expected Output

```
✓ tests/prompts.next.test.ts (10)
  ✓ GET /api/prompts/next (10)
    ✓ returns 401 when no Authorization header
    ✓ returns 401 when token is invalid
    ✓ returns top existing active prompt with highest tier and score
    ✓ filters out prompts with forbidden words (generic nouns)
    ✓ filters out prompts longer than 30 words
    ✓ generates Tier-1 prompt from latest story when no valid existing prompts
    ✓ returns decade fallback when no stories exist for user
    ✓ skips expired prompts and generates new one
    ✓ respects is_locked flag and skips locked prompts
    ✓ returns prompt with correct schema structure

✓ tests/prompts.skip.test.ts (10)
  ✓ POST /api/prompts/skip (10)
    ✓ returns 401 when no Authorization header
    ✓ returns 404 when promptId not found for user
    ✓ increments skip_count by 1 on first skip
    ✓ increments skip_count to 2 on second skip without retiring
    ✓ archives to prompt_history and removes from active_prompts on 3rd skip
    ✓ skips by promptText instead of promptId
    ✓ falls back to shown_count when skip_count does not exist
    ✓ returns 400 when neither promptId nor promptText is provided
    ✓ sets last_shown_at timestamp when skipping
    ✓ handles multiple sequential skips correctly

Test Files  2 passed (2)
     Tests  20 passed (20)
  Start at  10:30:45
  Duration  1.2s
```

## Important Notes

1. **No Network Calls**: All tests run in isolation with mocked Supabase
2. **Global fetch Mock**: POST skip calls GET next - mocked to use actual handler
3. **Reset Between Tests**: `resetDb()` called before each test via `beforeEach`
4. **Real Validation Logic**: `generateTier1Prompts` and `validatePromptQuality` are NOT mocked - actual implementation is tested
5. **TypeScript Strict**: All code compiles cleanly with strict mode

## Troubleshooting

### Tests failing with "Cannot find module @/..."

Check that `vitest.config.ts` has correct path alias:

```typescript
alias: {
  '@': path.resolve(__dirname, './'),
}
```

### "fetch is not defined" error

Ensure `tests/setup.ts` mocks `global.fetch` in the skip tests.

### Database state leaking between tests

Verify `beforeEach(() => resetDb())` is in `tests/setup.ts`.

## Next Steps

To add more tests:

1. Add new test cases to existing files
2. Create new test files for other endpoints
3. Extend `db` schema in mock if needed
4. Add more helper functions in `tests/utils.ts`

## Example: Adding a New Test

```typescript
it('your new test case', async () => {
  // Arrange
  seedDb({
    active_prompts: [/* your test data */],
  });

  // Act
  const req = createAuthRequest('http://localhost/api/prompts/next');
  const res = await GET(req);

  // Assert
  expect(res.status).toBe(200);
  const json = await res.json();
  expect(json.prompt).toBeDefined();
});
```
