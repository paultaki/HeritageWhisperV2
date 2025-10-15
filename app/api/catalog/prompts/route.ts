import { NextRequest, NextResponse } from 'next/server';
import { CATALOG, categoryGate, isSensitiveCategory } from '@/data/prompt_catalog';
import { getUserGates } from '@/data/user_gates';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || '';
    const showSensitive = searchParams.get('showSensitive') === 'true';

    const gates = await getUserGates();

    // Check category gate
    if (!categoryGate(category, gates)) {
      return NextResponse.json({ prompts: [] });
    }

    // Check sensitive category filter
    if (isSensitiveCategory(category) && !showSensitive) {
      return NextResponse.json({ prompts: [] });
    }

    // Get prompts from catalog
    const categoryPrompts = CATALOG[category] || [];

    // Filter by gates and sensitivity
    const prompts = categoryPrompts
      .filter(p => {
        // Check per-prompt gates
        if (p.gates?.length) {
          return p.gates.every(g => (gates as any)[g] === true);
        }
        // Check per-prompt sensitivity
        if (p.sensitivity && p.sensitivity !== 'low' && !showSensitive) {
          return false;
        }
        return true;
      })
      .slice(0, 6)
      .map(p => ({
        id: p.id,
        text: p.text,
        category,
        sensitivity: p.sensitivity || 'low'
      }));

    return NextResponse.json({ prompts });
  } catch (error) {
    console.error('Error fetching catalog prompts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompts' },
      { status: 500 }
    );
  }
}
