type Feature = {
  id: string
  title: string
  description: string
  imageAlt: string
  imagePosition: 'left' | 'right'
}

const features: Feature[] = [
  {
    id: 'timeline',
    title: 'The Timeline',
    description: 'Watch 80 years of wisdom unfold before your eyes. Stories organized by decade, patterns revealed across a lifetime. Tap any moment to hear it in their voice.',
    imageAlt: 'Timeline view screenshot showing decade markers, story cards, clean organization',
    imagePosition: 'left',
  },
  {
    id: 'book',
    title: 'The Living Book',
    description: 'Read their story like a memoir—but one that speaks. Every chapter flows naturally, with their original recordings embedded throughout. The book that speaks in their voice.',
    imageAlt: 'Book view screenshot showing text with embedded audio players',
    imagePosition: 'right',
  },
  {
    id: 'memory-box',
    title: 'The Memory Box',
    description: 'Photos, documents, and keepsakes—each with the story behind it. Upload the artifact, record the memory. Context for every treasure.',
    imageAlt: 'Memory box view showing photos with associated stories',
    imagePosition: 'left',
  },
]

export default function ProductShowcase() {
  return (
    <section className="py-16 md:py-24">
      {features.map((feature, index) => (
        <div
          key={feature.id}
          className={`${index % 2 === 0 ? 'bg-[var(--hw-page-bg)]' : 'bg-[var(--hw-section-bg)]'} py-16 md:py-20 px-6 md:px-12`}
        >
          <div className="max-w-[1140px] mx-auto">
            <div className={`grid md:grid-cols-2 gap-12 items-center ${feature.imagePosition === 'right' ? '' : ''}`}>
              {/* Image */}
              <div className={`${feature.imagePosition === 'right' ? 'order-1 md:order-2' : 'order-1'}`}>
                <div className="bg-[var(--hw-surface)] border-2 border-dashed border-[var(--hw-border-subtle)] rounded-2xl flex items-center justify-center aspect-[4/3] shadow-lg">
                  <span className="text-[var(--hw-text-muted)] text-base text-center px-4">
                    [IMAGE: {feature.imageAlt}]
                  </span>
                </div>
              </div>

              {/* Text */}
              <div className={`${feature.imagePosition === 'right' ? 'order-2 md:order-1' : 'order-2'}`}>
                <h3 className="text-[28px] md:text-[32px] font-semibold text-[var(--hw-primary)] mb-4">
                  {feature.title}
                </h3>
                <p className="text-lg text-[var(--hw-text-secondary)] leading-relaxed max-w-[50ch]">
                  {feature.description}
                </p>
              </div>
            </div>
          </div>

          {/* Gold accent line between sections (except after last) */}
          {index < features.length - 1 && (
            <div className="max-w-[200px] mx-auto mt-16 md:mt-20">
              <div className="h-px bg-gradient-to-r from-transparent via-[var(--hw-accent-gold)] to-transparent opacity-50" />
            </div>
          )}
        </div>
      ))}
    </section>
  )
}
