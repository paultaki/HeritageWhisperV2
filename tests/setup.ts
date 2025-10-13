import { vi } from 'vitest';
import { mockSupabaseAdmin, resetDb } from './mocks/supabaseAdmin.mock';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: mockSupabaseAdmin,
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Reset database before each test
beforeEach(() => {
  resetDb();
});
