const testimonials = [
  {
    quote: "I gave this to my dad for his 75th birthday. Within a week, he'd recorded stories I'd never heard—about his time in the Navy, meeting Mom, starting his business. Best gift I've ever given.",
    name: '[Name]',
    role: 'Gave HeritageWhisper to her father',
    photoPlaceholder: 'Professional headshot, 35-50 year old',
  },
  {
    quote: "I've told stories I forgot I had. The questions it asks—they're not the obvious ones. It asked me about the smell of my grandmother's kitchen, and suddenly I was eight years old again.",
    name: '[Name]',
    role: 'Recording her family legacy',
    photoPlaceholder: 'Warm photo, 65-75 year old',
  },
  {
    quote: "Hearing Grandpa's voice telling his stories... that's something I'll play for my own kids someday. It's not just memories—it's him.",
    name: '[Name]',
    role: 'Family member',
    photoPlaceholder: '25-40 year old',
  },
]

export default function Testimonials() {
  return (
    <section className="bg-[var(--hw-section-bg)] py-16 md:py-24 px-6 md:px-12">
      <div className="max-w-[1140px] mx-auto">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-[28px] md:text-[32px] font-semibold text-[var(--hw-primary)]">
            Real Families, Real Stories
          </h2>
        </div>

        {/* Testimonial Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-[var(--hw-surface)] rounded-xl p-8 shadow-sm border border-[var(--hw-border-subtle)]"
            >
              {/* Quote mark */}
              <div className="text-[var(--hw-accent-gold)] text-5xl font-serif leading-none mb-4">
                "
              </div>

              {/* Quote text */}
              <blockquote className="text-base text-[var(--hw-text-secondary)] leading-relaxed mb-6">
                {testimonial.quote}
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4">
                {/* Photo placeholder with gold ring */}
                <div className="w-16 h-16 rounded-full bg-[var(--hw-section-bg)] border-2 border-[var(--hw-accent-gold)] flex items-center justify-center flex-shrink-0">
                  <span className="text-[var(--hw-text-muted)] text-xs text-center px-1">
                    [Photo]
                  </span>
                </div>

                <div>
                  <p className="text-base font-semibold text-[var(--hw-text-primary)]">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-[var(--hw-text-muted)]">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
