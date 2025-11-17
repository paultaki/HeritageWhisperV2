export default function ComparisonTable() {
  const features = [
    { name: 'Stories Limit', heritage: 'Unlimited ✓', remento: '52 🚫', storyworth: '52 🚫' },
    { name: 'Keeps Growing', heritage: 'Forever ✓', remento: '1 year 🚫', storyworth: '1 year 🚫' },
    { name: 'Family Alerts', heritage: 'Yes ✓', remento: 'No 🚫', storyworth: 'No 🚫' },
    { name: 'Wisdom Extract', heritage: 'Yes ✓', remento: 'No 🚫', storyworth: 'No 🚫' },
    { name: 'Beautiful Timeline', heritage: 'Yes ✓', remento: 'No 🚫', storyworth: 'No 🚫' },
    { name: 'Memory Treasures', heritage: 'Yes ✓', remento: 'No 🚫', storyworth: 'No 🚫' },
    { name: 'Price', heritage: 'Free (Sharing: $79/yr)', remento: '$99+book', storyworth: '$99+book' }
  ]

  return (
    <section className="py-16 md:py-24 px-6 md:px-12 bg-heritage-warm-paper">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-sm rounded-full border border-heritage-deep-slate/10 shadow-sm mb-6">
            <span className="text-sm font-semibold text-heritage-deep-slate tracking-wide">Side-by-Side Comparison</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-heritage-text-primary">
            See the Difference
          </h2>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-heritage-deep-slate/10 transition-all duration-500 hover:shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="relative z-10">
                <tr className="border-b border-heritage-deep-slate/10">
                  <th className="sticky left-0 z-50 isolate px-6 py-4 text-left text-sm font-semibold text-heritage-text-primary/70 bg-white shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-white bg-heritage-deep-slate">
                    HeritageWhisper
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-heritage-text-primary/70 bg-heritage-deep-slate/5">Remento</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-heritage-text-primary/70 bg-heritage-deep-slate/5">StoryWorth</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr
                    key={index}
                    className={`border-b border-heritage-deep-slate/5 hover:bg-heritage-deep-slate/5 transition-colors duration-200 ${
                      index === features.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    <td className="sticky left-0 z-10 px-6 py-4 text-sm font-medium text-heritage-text-primary bg-white shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">{feature.name}</td>
                    <td className="px-6 py-4 text-center text-sm font-semibold bg-heritage-deep-slate/5">
                      <span className={feature.name === 'Price' ? 'text-heritage-muted-green text-base font-bold' : 'text-heritage-muted-green'}>
                        {feature.heritage}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-heritage-text-primary/60">{feature.remento}</td>
                    <td className="px-6 py-4 text-center text-sm text-heritage-text-primary/60">{feature.storyworth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom note */}
        <div className="text-center mt-8">
          <p className="text-heritage-text-primary/70 text-lg">
            Only HeritageWhisper keeps your legacy growing <span className="font-semibold text-heritage-text-primary">forever</span>
          </p>
        </div>
      </div>
    </section>
  )
}
