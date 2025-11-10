import Image from 'next/image'

export default function TestimonialStories() {
  const stories = [
    {
      image: '/frank.webp',
      imageAlt: 'Elderly man with phone',
      headline: 'Frank, 78, has recorded 67 stories',
      story: 'Started with his war stories. Now shares memories as they come. His grandkids in California listen on their commute.'
    },
    {
      image: '/johnsons.webp',
      imageAlt: 'Three generations at dinner table',
      headline: 'The Johnsons: 3 generations, 5 states',
      story: 'Grandma records in Florida. Kids listen in New York, Texas, Seattle. More connected than when they lived next door.'
    },
    {
      image: '/Sarah.webp',
      imageAlt: 'Woman looking at phone, smiling',
      headline: 'Sarah discovered her mom\'s humor',
      story: '"I never knew mom was funny until I heard her stories. The book would have missed her laugh, her timing, everything."'
    }
  ]

  return (
    <section className="py-16 md:py-24 px-6 md:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full border border-orange-200 mb-6">
            <span className="text-sm font-semibold text-orange-700">Real Families</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            Real Families, Real Connection
          </h2>
        </div>

        {/* Stories grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stories.map((story, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-white to-orange-50 rounded-2xl shadow-lg border border-stone-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Photo */}
              <div className="aspect-[4/3] relative overflow-hidden border-b border-stone-300 bg-gradient-to-br from-stone-100 to-stone-200">
                <Image
                  src={story.image}
                  alt=""
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
              </div>

              {/* Content */}
              <div className="p-6 space-y-3">
                <h3 className="text-xl font-bold text-gray-900">
                  {story.headline}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {story.story}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
