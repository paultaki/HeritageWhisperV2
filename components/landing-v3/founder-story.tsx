export default function FounderStory() {
  return (
    <section id="founder-story" className="py-16 md:py-24 px-6 md:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200 mb-6">
            <span className="text-sm font-semibold text-blue-700">Our Story</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            Built by Family, for Families
          </h2>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
          {/* Text - 60% */}
          <div className="lg:col-span-3 space-y-6">
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
              I realized my parents had boxes of photos no one else could identify. When they're gone,
              those become meaningless snapshots. I built HeritageWhisper to capture the stories behind
              every photo while we still can.
            </p>

            <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
              Books capture stories in a single moment, then sit on a shelf collecting dust. But there
              are always more stories to be told. I wanted something that could grow forever, alert me
              the moment a new story was added, and let me listen instantly no matter where I was in the world.
            </p>

            <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
              With four siblings scattered across the country and 23 grandkids in our immediate family,
              it's impossible to share a physical book. But now we all have the same access to our
              parents' stories the moment they're recorded. Our kids treasure hearing these memories
              in their grandparents' own voices as much as we do.
            </p>

            <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
              The majority of seniors are on smartphones, it's how we all consume everything these days.
              We can even submit questions directly to them, capturing those precious memories before it's too late.
            </p>

            <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
              After 20 years as a senior executive at a Fortune 50 company, I left to build this full-time
              alongside my retired father. We're committed to making it easy for you to capture your parents'
              memories in their voices, with an interface so simple it reduces your tech support calls :)
            </p>

            <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
              Your privacy and the longevity of your precious stories matter to us. We will never sell or
              share your data. You're always in full control.
            </p>

            <div className="pt-6">
              <p className="text-xl font-semibold text-gray-900">— Paul, Founder & CEO</p>
            </div>
          </div>

          {/* Image - 40% */}
          <div className="lg:col-span-2">
            <div className="aspect-square relative rounded-2xl overflow-hidden shadow-2xl border border-stone-200 bg-gradient-to-br from-blue-50 to-orange-50">
              {/* Placeholder for founder photo */}
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
