import type { Gates } from './prompt_catalog';

export async function getUserGates(): Promise<Gates> {
  // TODO: load from profile if available. Return defaults for v1.
  return {
    requiresChildren: false,
    requiresCollege: false,
    hasSiblings: true,
    hasSpouseOrPartner: false,
    hasPets: true
  };
}
