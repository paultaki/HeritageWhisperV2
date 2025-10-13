import { vi } from 'vitest';

// In-memory database
export const db = {
  users: [] as any[],
  active_prompts: [] as any[],
  prompt_history: [] as any[],
  stories: [] as any[],
};

export function resetDb() {
  db.users = [{ id: 'U1', birth_year: 1980 }];
  db.active_prompts = [];
  db.prompt_history = [];
  db.stories = [];
}

export function seedDb(partial: Partial<typeof db>) {
  if (partial.users) db.users.push(...partial.users);
  if (partial.active_prompts) db.active_prompts.push(...partial.active_prompts);
  if (partial.prompt_history) db.prompt_history.push(...partial.prompt_history);
  if (partial.stories) db.stories.push(...partial.stories);
}

// Query builder implementation
class QueryBuilder {
  private table: string;
  private filters: Array<{ field: string; value: any; op: string }> = [];
  private orderBy: Array<{ field: string; ascending: boolean }> = [];
  private limitCount: number | null = null;
  private selectFields = '*';

  constructor(table: string) {
    this.table = table;
  }

  select(fields: string = '*') {
    this.selectFields = fields;
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, value, op: 'eq' });
    return this;
  }

  gt(field: string, value: any) {
    this.filters.push({ field, value, op: 'gt' });
    return this;
  }

  not(field: string, op: string, value: any) {
    this.filters.push({ field, value, op: 'not' });
    return this;
  }

  order(field: string, options: { ascending: boolean }) {
    this.orderBy.push({ field, ascending: options.ascending });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  private applyFilters(records: any[]): any[] {
    return records.filter((record) => {
      return this.filters.every(({ field, value, op }) => {
        if (op === 'eq') return record[field] === value;
        if (op === 'gt') {
          if (field === 'expires_at') {
            return new Date(record[field]) > new Date(value);
          }
          return record[field] > value;
        }
        if (op === 'not') return record[field] !== null && record[field] !== undefined;
        return true;
      });
    });
  }

  private applyOrdering(records: any[]): any[] {
    if (this.orderBy.length === 0) return records;

    return [...records].sort((a, b) => {
      for (const { field, ascending } of this.orderBy) {
        const aVal = a[field] ?? 0;
        const bVal = b[field] ?? 0;
        if (aVal < bVal) return ascending ? -1 : 1;
        if (aVal > bVal) return ascending ? 1 : -1;
      }
      return 0;
    });
  }

  async single() {
    const records = this.applyOrdering(this.applyFilters(db[this.table as keyof typeof db]));
    if (records.length === 0) {
      return { data: null, error: new Error('No rows found') };
    }
    return { data: records[0], error: null };
  }

  async maybeSingle() {
    const records = this.applyOrdering(this.applyFilters(db[this.table as keyof typeof db]));
    return { data: records[0] || null, error: null };
  }

  async then(resolve: (value: any) => void) {
    let records = this.applyFilters(db[this.table as keyof typeof db]);
    records = this.applyOrdering(records);
    if (this.limitCount !== null) {
      records = records.slice(0, this.limitCount);
    }
    resolve({ data: records, error: null });
  }

  insert(payload: any | any[]) {
    const records = Array.isArray(payload) ? payload : [payload];
    const inserted = records.map((record) => ({
      id: record.id || `ID${Date.now()}${Math.random()}`,
      ...record,
      created_at: record.created_at || new Date().toISOString(),
    }));
    
    db[this.table as keyof typeof db].push(...inserted);
    
    return {
      select: (fields: string = '*') => ({
        single: async () => ({ data: inserted[0], error: null }),
        then: async (resolve: (value: any) => void) => resolve({ data: inserted, error: null }),
      }),
    };
  }

  update(updates: any) {
    const records = this.applyFilters(db[this.table as keyof typeof db]);
    records.forEach((record) => {
      Object.assign(record, updates);
    });
    return {
      eq: (field: string, value: any) => {
        return {
          eq: (field2: string, value2: any) => {
            return Promise.resolve({ data: records, error: null });
          },
        };
      },
    };
  }

  delete() {
    const toDelete = this.applyFilters(db[this.table as keyof typeof db]);
    const tableData = db[this.table as keyof typeof db];
    
    return {
      eq: (field: string, value: any) => {
        return {
          eq: (field2: string, value2: any) => {
            const filtered = tableData.filter((record) => {
              return !(record[field] === value && record[field2] === value2);
            });
            (db as any)[this.table] = filtered;
            return Promise.resolve({ data: toDelete, error: null });
          },
        };
      },
    };
  }
}

// Mock Supabase client
export function mockSupabaseAdmin() {
  return {
    auth: {
      getUser: vi.fn(async (token: string) => {
        if (token === 'VALID') {
          return { data: { user: { id: 'U1' } }, error: null };
        }
        return { data: { user: null }, error: new Error('Invalid token') };
      }),
    },
    from: (table: string) => new QueryBuilder(table),
  };
}
