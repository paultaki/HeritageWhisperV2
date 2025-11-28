import Image from 'next/image'

export default function FounderStory() {
  return (
    <section className="bg-[var(--hw-page-bg)] py-16 md:py-24 px-6 md:px-12">
      <div className="max-w-[1140px] mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-[var(--hw-secondary)] uppercase tracking-wide mb-2">
            Our Story
          </p>
          <h2 className="text-[28px] md:text-[32px] font-semibold text-[var(--hw-primary)]">
            Built by Family, for Families
          </h2>
        </div>

        {/* Content */}
        <div className="grid md:grid-cols-5 gap-12 items-center">
          {/* Photo - 2 columns */}
          <div className="md:col-span-2 order-1 md:order-1">
            <div className="aspect-square max-w-[300px] mx-auto">
              <div className="w-full h-full rounded-2xl overflow-hidden shadow-lg">
                <Image
                  src="/Paul.webp"
                  alt="Paul, Founder & CEO of HeritageWhisper"
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Text - 3 columns */}
          <div className="md:col-span-3 order-2 md:order-2">
            <div className="space-y-5 text-lg text-[var(--hw-text-secondary)] leading-relaxed max-w-[65ch]">
              <p>
                I noticed our parents' photo albums had something missing. The photos had dates, but no context.
                We could name most of the faces, but not the place, not the moment, not why it mattered.
                I built HeritageWhisper to capture the stories behind every photo while we still can.
              </p>

              <p>
                Books capture stories in a single moment, then sit on a shelf collecting dust. I wanted something
                that could grow forever, alert me the moment a new story was added, and let me listen instantly anywhere.
              </p>

              <p>
                With four siblings scattered across the country and 16 grandkids in our immediate family,
                it's impossible to share a physical book. But now we all have the same access to our
                parents' stories the moment they're recorded. Our kids treasure hearing these memories
                in their grandparents' own voices.
              </p>

              <p>
                Most seniors are on smartphones. We can submit questions directly to them, capturing those
                precious memories before it's too late.
              </p>

              <p>
                After 20 years as a senior executive at a Fortune 50 company, I left to build this full-time
                alongside my retired father. We're committed to making it easy for you to capture your parents'
                memories in their voices, with an interface so simple it reduces your tech support calls :)
              </p>

              <p>
                Your privacy and the longevity of your precious stories matter to us. We will never sell or
                share your data. You're always in full control.
              </p>
            </div>

            {/* Signature */}
            <div className="mt-8">
              <p className="font-semibold text-[var(--hw-text-primary)] text-lg">
                — Paul, Founder & CEO
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
