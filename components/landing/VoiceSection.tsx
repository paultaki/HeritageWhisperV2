export default function VoiceSection() {
  return (
    <section className="bg-[var(--hw-page-bg)] py-16 md:py-24 px-6 md:px-12">
      <div className="max-w-[1140px] mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="order-2 md:order-1">
            <h2 className="text-[28px] md:text-[32px] font-semibold text-[var(--hw-primary)] mb-6 leading-tight">
              Text captures the facts. Voice captures the soul.
            </h2>
            <p className="text-lg text-[var(--hw-text-secondary)] leading-relaxed max-w-[50ch]">
              When Dad talks about his first car, you don't just get the make and model—you hear
              the pride in his voice when he describes saving every paycheck. When Mom recalls
              her wedding day, you hear the catch in her throat. That's what gets preserved.
            </p>

            {/* Optional audio waveform hint */}
            <div className="mt-8 flex items-center gap-3 text-[var(--hw-text-muted)]">
              <div className="flex items-end gap-1 h-6">
                {[3, 5, 8, 6, 9, 4, 7, 5, 8, 6, 4, 7, 5, 3].map((height, i) => (
                  <div
                    key={i}
                    className="w-1 bg-[var(--hw-secondary)] rounded-full opacity-60"
                    style={{ height: `${height * 2.5}px` }}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">Hear the difference</span>
            </div>
          </div>

          {/* Image Placeholder */}
          <div className="order-1 md:order-2">
            <div className="bg-[var(--hw-section-bg)] border-2 border-dashed border-[var(--hw-border-subtle)] rounded-2xl flex items-center justify-center aspect-[4/3] shadow-sm">
              <span className="text-[var(--hw-text-muted)] text-base text-center px-4">
                [IMAGE: Senior recording on phone, or family listening together. Warm, authentic, not staged.]
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
