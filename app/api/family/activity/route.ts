import { NextRequest, NextResponse } from 'next/server';

// Stub endpoint - Activity tracking not yet implemented
export async function GET(req: NextRequest) {
  // TODO: Implement activity tracking in Phase 2
  // For now, return empty array
  return NextResponse.json([]);
}
