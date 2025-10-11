/** traits: [{label, confidence}] — render a single chip; collapse handled via CSS */
export default function StoryTraits({
  traits = [],
}: {
  traits: Array<{ label: string; confidence: number }>;
}) {
  if (!traits.length) return null;
  const t = traits[0];
  return (
    <div className="story-traits one-line" aria-label="Character trait signal">
      <span className="trait-chip">
        {t.label} <span className="trait-score">{t.confidence.toFixed(2)}</span>
      </span>
    </div>
  );
}
