import Image from 'next/image'

export default function FounderStory() {
  return (
    <section className="bg-[var(--hw-page-bg)] py-16 md:py-24 px-6 md:px-12">
      <div className="max-w-[1140px] mx-auto">
        {/* Header */}
        <div className="mb-12">
          <p className="text-sm font-medium text-[var(--hw-secondary)] uppercase tracking-wide mb-2 text-center">
            Our Story
          </p>
          <h2 className="text-[28px] md:text-[32px] font-semibold text-[var(--hw-primary)] text-center">
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
                With four siblings scattered across the country and 16 grandkids, sharing a physical book
                was impossible. Now we all have instant access the moment a story is recorded—and our kids
                treasure hearing these memories in their grandparents' own voices.
              </p>

              <p>
                After 20 years as a Fortune 50 executive, I left to build this full-time alongside my
                retired father. We're committed to making it easy to capture your parents' memories,
                with an interface so simple it reduces your tech support calls :)
              </p>

              <p>
                Your privacy and the longevity of your stories matter to us. We never sell or share
                your data. You're always in full control.
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
