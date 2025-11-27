export default function FounderStory() {
  return (
    <section className="bg-[var(--hw-page-bg)] py-16 md:py-24 px-6 md:px-12">
      <div className="max-w-[1140px] mx-auto">
        <div className="grid md:grid-cols-5 gap-12 items-center">
          {/* Photo - 2 columns */}
          <div className="md:col-span-2 order-1 md:order-1">
            <div className="aspect-square max-w-[300px] mx-auto">
              <div className="w-full h-full bg-[var(--hw-section-bg)] border-2 border-dashed border-[var(--hw-border-subtle)] rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-[var(--hw-text-muted)] text-base text-center px-4">
                  [PHOTO: Founder headshot - professional but warm]
                </span>
              </div>
            </div>
          </div>

          {/* Text - 3 columns */}
          <div className="md:col-span-3 order-2 md:order-2">
            {/* Eyebrow */}
            <p className="text-sm font-medium text-[var(--hw-secondary)] uppercase tracking-wide mb-2">
              Our Story
            </p>

            <h2 className="text-[28px] md:text-[32px] font-semibold text-[var(--hw-primary)] mb-6">
              Built by Family, for Families
            </h2>

            <div className="space-y-5 text-lg text-[var(--hw-text-secondary)] leading-relaxed max-w-[65ch]">
              <p>
                I spent 25 years in telecom, eventually becoming one of Verizon's youngest executives.
                I thought I understood technology's power to connect people.
              </p>

              <p>
                Then my father turned 80, and I realized the stories I most wanted to hear were the
                ones I'd never thought to ask for. The everyday wisdom. The small moments that shaped
                who he became—and who I became.
              </p>

              <p>
                I built HeritageWhisper because every family deserves to capture these stories before
                they're gone. Not in a book that sits on a shelf, but in a living legacy that grows,
                that speaks, that keeps giving.
              </p>

              <p className="text-[var(--hw-text-primary)] font-medium italic">
                This isn't just an app. It's the conversations I wish I'd started sooner.
              </p>
            </div>

            {/* Signature */}
            <div className="mt-8">
              <p className="font-semibold text-[var(--hw-text-primary)] text-lg">
                — Paul, Founder
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
