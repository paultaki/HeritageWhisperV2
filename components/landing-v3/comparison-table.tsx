export default function ComparisonTable() {
  const features = [
    { name: 'Stories Limit', heritage: 'Unlimited ✓', remento: '52 🚫', storyworth: '52 🚫' },
    { name: 'Keeps Growing', heritage: 'Forever ✓', remento: '1 year 🚫', storyworth: '1 year 🚫' },
    { name: 'Family Alerts', heritage: 'Yes ✓', remento: 'No 🚫', storyworth: 'No 🚫' },
    { name: 'AI Wisdom Extract', heritage: 'Yes ✓', remento: 'No 🚫', storyworth: 'No 🚫' },
    { name: 'Beautiful Timeline', heritage: 'Yes ✓', remento: 'No 🚫', storyworth: 'No 🚫' },
    { name: 'Memory Treasures', heritage: 'Yes ✓', remento: 'No 🚫', storyworth: 'No 🚫' },
    { name: 'Price', heritage: '$79/year', remento: '$99+book', storyworth: '$99+book' }
  ]

  return (
    <section className="py-16 md:py-24 px-6 md:px-12 bg-[#faf8f5]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-stone-200 shadow-sm mb-6">
            <span className="text-sm font-semibold text-gray-700">Side-by-Side Comparison</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            See the Difference
          </h2>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 bg-gray-50">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-white bg-blue-600">
                    HeritageWhisper
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600 bg-gray-50">Remento</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600 bg-gray-50">StoryWorth</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr
                    key={index}
                    className={`border-b border-gray-100 hover:bg-blue-50/30 transition-colors ${
                      index === features.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{feature.name}</td>
                    <td className="px-6 py-4 text-center text-sm font-semibold bg-blue-50">
                      <span className={feature.name === 'Price' ? 'text-green-700 text-base' : 'text-green-700'}>
                        {feature.heritage}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">{feature.remento}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">{feature.storyworth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom note */}
        <div className="text-center mt-8">
          <p className="text-gray-600 text-lg">
            Only HeritageWhisper keeps your legacy growing <span className="font-semibold text-gray-900">forever</span>
          </p>
        </div>
      </div>
    </section>
  )
}
