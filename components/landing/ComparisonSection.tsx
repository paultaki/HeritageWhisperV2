export default function ComparisonSection() {
  const oldWay = [
    'Wait for a written prompt every week',
    'Hope they actually write back',
    'Get a printed book 12 months later',
    'Stories sit on a shelf, rarely opened',
  ]

  const heritageWay = [
    'Record anytime the mood strikes',
    'AI asks follow-up questions in real time',
    'Family listens instantly—from anywhere',
    'A living legacy that grows with every story',
  ]

  return (
    <section className="bg-[var(--hw-page-bg)] py-16 md:py-24 px-6 md:px-12">
      <div className="max-w-[1140px] mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h2 className="text-[28px] md:text-[32px] font-semibold text-[var(--hw-primary)] mb-3 text-center">
            Why a living legacy?
          </h2>
          <p className="text-lg text-[var(--hw-text-secondary)] text-center">
            Print-and-wait services had their moment. Here's what's next.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-[900px] mx-auto mb-10">
          {/* The Old Way */}
          <div className="bg-[var(--hw-surface)] rounded-xl p-6 md:p-8 border border-[var(--hw-border-subtle)]">
            <h3 className="text-xl font-semibold text-[var(--hw-text-primary)] mb-6">
              The Old Way
            </h3>
            <ul className="space-y-4">
              {oldWay.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[var(--hw-text-muted)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-[var(--hw-text-secondary)] text-base">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* HeritageWhisper */}
          <div className="bg-[var(--hw-secondary-soft)] rounded-xl p-6 md:p-8 border border-[var(--hw-secondary)]/20">
            <h3 className="text-xl font-semibold text-[var(--hw-primary)] mb-6">
              HeritageWhisper
            </h3>
            <ul className="space-y-4">
              {heritageWay.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[var(--hw-secondary)] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[var(--hw-text-primary)] text-base">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-center text-xl text-[var(--hw-secondary)] font-medium italic">
          No QR codes. No waiting for the mail. Just conversation.
        </p>
      </div>
    </section>
  )
}
