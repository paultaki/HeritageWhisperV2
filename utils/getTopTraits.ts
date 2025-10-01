export type Trait = { label: string; confidence: number };

type AnyTrait = {
  name?: string; label?: string;
  score?: number; confidence?: number; value?: number;
};
type StoryLike = Record<string, any>;

/** Normalize trait arrays from common shapes and return up to n top traits. */
export function getTopTraits(story: StoryLike, n = 1, min = 0.6): Trait[] {
  if (!story) return [];
  const buckets = [
    story.traits,
    story.character,
    story.insights,
    story.analysis?.traits,
    story.meta?.traits,
  ].filter(Boolean) as AnyTrait[][];
  const raw: AnyTrait[] = (buckets[0] || []);
  const normalized: Trait[] = raw.map(t => {
    const label = (t.label || t.name || "").toString().trim();
    const v = t.confidence ?? t.score ?? t.value;
    const c = typeof v === "number" ? (v < 0 ? 0 : v > 1 ? 1 : v) : NaN;
    return label && !Number.isNaN(c) ? { label, confidence: c } : null;
  }).filter(Boolean) as Trait[];
  normalized.sort((a,b) => b.confidence - a.confidence);
  const above = normalized.filter(t => t.confidence >= min).slice(0, n);
  if (above.length) return above;
  return normalized.slice(0, Math.min(1, n)); // if nothing meets min, show top 1 or none
}